import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Project } from "@/types/manufacturing";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: number;
  currentProjects: string[];
  workload: number;
  hoursAllocated: number;
  hoursEarned: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
  leader: string;
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ResourceAllocation {
  id: string;
  projectId: string;
  memberId: string;
  teamId?: string;
  allocation: number;
  hoursAllocated: number;
  hoursEarned: number;
  startDate: string;
  endDate: string;
}

export function ResourceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showAllocateResourceDialog, setShowAllocateResourceDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("team-management");
  
  // Form states
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamLeader, setNewTeamLeader] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberSkills, setNewMemberSkills] = useState("");
  const [allocationAmount, setAllocationAmount] = useState(0);
  const [allocatedHours, setAllocatedHours] = useState(0);
  const [allocationStartDate, setAllocationStartDate] = useState("");
  const [allocationEndDate, setAllocationEndDate] = useState("");
  const [selectedMemberForAllocation, setSelectedMemberForAllocation] = useState("");
  const [selectedTeamForAllocation, setSelectedTeamForAllocation] = useState("");

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/manufacturing/resources/team'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/resources/team');
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    }
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/manufacturing/resources/teams'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/resources/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    }
  });

  const { data: allocations = [] } = useQuery<ResourceAllocation[]>({
    queryKey: ['/api/manufacturing/resources/allocations'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/resources/allocations');
      if (!response.ok) throw new Error('Failed to fetch resource allocations');
      return response.json();
    }
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Mutations for adding a new team
  const addTeamMutation = useMutation({
    mutationFn: async (newTeam: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/manufacturing/resources/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      if (!response.ok) throw new Error('Failed to create team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/resources/teams'] });
      setShowAddTeamDialog(false);
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamLeader("");
      toast({
        title: "Team created",
        description: "The team has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create team: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for adding a new team member
  const addMemberMutation = useMutation({
    mutationFn: async (newMember: Omit<TeamMember, 'id' | 'currentProjects' | 'workload' | 'availability' | 'hoursAllocated' | 'hoursEarned'>) => {
      const response = await fetch('/api/manufacturing/resources/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      if (!response.ok) throw new Error('Failed to add team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/resources/team'] });
      setShowAddMemberDialog(false);
      setNewMemberName("");
      setNewMemberRole("");
      setNewMemberSkills("");
      toast({
        title: "Team member added",
        description: "The team member has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add team member: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for allocating resources
  const allocateResourceMutation = useMutation({
    mutationFn: async (allocation: Omit<ResourceAllocation, 'id'>) => {
      const response = await fetch('/api/manufacturing/resources/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation)
      });
      if (!response.ok) throw new Error('Failed to allocate resource');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/resources/allocations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/resources/team'] });
      setShowAllocateResourceDialog(false);
      setSelectedProject(null);
      setAllocationAmount(0);
      setAllocatedHours(0);
      setAllocationStartDate("");
      setAllocationEndDate("");
      setSelectedMemberForAllocation("");
      setSelectedTeamForAllocation("");
      toast({
        title: "Resource allocated",
        description: "The resource has been successfully allocated to the project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to allocate resource: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAddTeam = () => {
    if (!newTeamName) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    addTeamMutation.mutate({
      name: newTeamName,
      description: newTeamDescription,
      leader: newTeamLeader,
      members: [],
      projectIds: []
    });
  };

  const handleAddMember = () => {
    if (!newMemberName || !newMemberRole) {
      toast({
        title: "Error",
        description: "Name and role are required",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({
      name: newMemberName,
      role: newMemberRole,
      skills: newMemberSkills.split(',').map(skill => skill.trim())
    });
  };

  const handleAllocateResource = () => {
    if (!selectedProject || (!selectedMemberForAllocation && !selectedTeamForAllocation) || !allocationStartDate || !allocationEndDate) {
      toast({
        title: "Error",
        description: "Project, resource (member or team), and dates are required",
        variant: "destructive",
      });
      return;
    }

    allocateResourceMutation.mutate({
      projectId: selectedProject,
      memberId: selectedMemberForAllocation,
      teamId: selectedTeamForAllocation || undefined,
      allocation: allocationAmount,
      hoursAllocated: allocatedHours,
      hoursEarned: 0, // Initial earned hours is 0
      startDate: allocationStartDate,
      endDate: allocationEndDate
    });
  };

  const getTeamMembersForTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return teamMembers.filter(member => team.members.includes(member.id));
  };

  const getProjectsForTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return projects.filter(project => team.projectIds.includes(project.id));
  };

  const getProjectById = (projectId: string) => {
    return projects.find(project => project.id === projectId);
  };

  const getMemberById = (memberId: string) => {
    return teamMembers.find(member => member.id === memberId);
  };

  const getTeamById = (teamId: string) => {
    return teams.find(team => team.id === teamId);
  };

  const totalAllocationsByProject = (projectId: string) => {
    return allocations
      .filter(allocation => allocation.projectId === projectId)
      .reduce((total, allocation) => total + allocation.allocation, 0);
  };

  const totalHoursByProject = (projectId: string) => {
    return allocations
      .filter(allocation => allocation.projectId === projectId)
      .reduce((total, allocation) => total + allocation.hoursAllocated, 0);
  };

  const totalHoursEarnedByProject = (projectId: string) => {
    return allocations
      .filter(allocation => allocation.projectId === projectId)
      .reduce((total, allocation) => total + allocation.hoursEarned, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Resource Management</h2>
          <p className="text-muted-foreground">
            Manage teams, allocate resources, and track project hours
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAddMemberDialog(true)}
          >
            <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
            Add Member
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAddTeamDialog(true)}
          >
            <FontAwesomeIcon icon="users-gear" className="mr-2 h-4 w-4" />
            Create Team
          </Button>
          <Button 
            onClick={() => setShowAllocateResourceDialog(true)}
          >
            <FontAwesomeIcon icon="link" className="mr-2 h-4 w-4" />
            Allocate Resources
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="team-management">
            <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="project-allocations">
            <FontAwesomeIcon icon="project-diagram" className="mr-2 h-4 w-4" />
            Project Allocations
          </TabsTrigger>
          <TabsTrigger value="time-tracking">
            <FontAwesomeIcon icon="clock" className="mr-2 h-4 w-4" />
            Time Tracking
          </TabsTrigger>
        </TabsList>

        {/* TEAM MANAGEMENT TAB */}
        <TabsContent value="team-management" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Teams List */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Manage production teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {teams.map((team) => (
                      <div 
                        key={team.id}
                        className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${selectedTeam === team.id ? 'bg-muted border-primary' : ''}`}
                        onClick={() => setSelectedTeam(team.id)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{team.name}</h3>
                          <Badge>{getTeamMembersForTeam(team.id).length} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{team.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">
                            Led by: {getMemberById(team.leader)?.name || 'Unassigned'}
                          </span>
                          <span className="text-xs">
                            {getProjectsForTeam(team.id).length} projects
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="col-span-8">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {selectedTeam 
                    ? `Members of ${getTeamById(selectedTeam)?.name}` 
                    : "All team members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {(selectedTeam 
                      ? getTeamMembersForTeam(selectedTeam) 
                      : teamMembers
                    ).map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center space-x-4 p-4 hover:bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="font-medium">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={member.workload > 80 ? "destructive" : "default"}>
                                {member.workload}% Allocated
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem>Edit Member</DropdownMenuItem>
                                  <DropdownMenuItem>Allocate to Project</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Workload</span>
                              <span>{member.workload}%</span>
                            </div>
                            <Progress value={member.workload} className="h-2" />
                            <div className="flex gap-2 flex-wrap">
                              {member.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Projects: {member.currentProjects.length}</span>
                              <span>Hours allocated: {member.hoursAllocated}</span>
                              <span>Hours earned: {member.hoursEarned}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROJECT ALLOCATIONS TAB */}
        <TabsContent value="project-allocations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Resource Allocations</CardTitle>
                <CardDescription>
                  Manage how resources are allocated across projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {projects.map((project) => (
                      <Card key={project.id} className="border shadow-none">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                project.status === "ACTIVE" ? "default" :
                                project.status === "COMPLETED" ? "success" :
                                project.status === "ON HOLD" ? "warning" : "secondary"
                              }>
                                {project.status}
                              </Badge>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      setSelectedProject(project.id);
                                      setShowAllocateResourceDialog(true);
                                    }}>
                                      <FontAwesomeIcon icon="plus" className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Allocate resources</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                            <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                            <span>Total allocation: {totalAllocationsByProject(project.id)}%</span>
                            <span>Hours: {totalHoursByProject(project.id)}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {allocations
                              .filter((allocation) => allocation.projectId === project.id)
                              .map((allocation) => (
                                <div key={allocation.id} className="flex items-center justify-between p-2 border rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <FontAwesomeIcon 
                                      icon={allocation.teamId ? "users" : "user"} 
                                      className="h-4 w-4 text-muted-foreground" 
                                    />
                                    <div>
                                      <p className="font-medium">
                                        {allocation.teamId 
                                          ? getTeamById(allocation.teamId)?.name 
                                          : getMemberById(allocation.memberId)?.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(allocation.startDate).toLocaleDateString()} - {new Date(allocation.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <p className="font-medium">{allocation.allocation}%</p>
                                      <p className="text-xs text-muted-foreground">Allocation</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{allocation.hoursAllocated}</p>
                                      <p className="text-xs text-muted-foreground">Hours</p>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>Edit Allocation</DropdownMenuItem>
                                        <DropdownMenuItem>Record Hours</DropdownMenuItem>
                                        <DropdownMenuItem>Remove Allocation</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TIME TRACKING TAB */}
        <TabsContent value="time-tracking" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hours Allocated vs. Earned</CardTitle>
                <CardDescription>
                  Track resource time utilization across projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.map((project) => {
                    const allocatedHours = totalHoursByProject(project.id);
                    const earnedHours = totalHoursEarnedByProject(project.id);
                    const hoursPercentage = allocatedHours > 0 ? (earnedHours / allocatedHours) * 100 : 0;
                    
                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {project.status} · {new Date(project.startDate).toLocaleDateString()} to {new Date(project.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{earnedHours} / {allocatedHours} hours</p>
                            <p className="text-sm text-muted-foreground">{hoursPercentage.toFixed(1)}% utilized</p>
                          </div>
                        </div>
                        <Progress value={hoursPercentage} className="h-2" />
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm">
                            <FontAwesomeIcon icon="clock" className="mr-2 h-4 w-4" />
                            Log Hours
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Team Dialog */}
      <Dialog open={showAddTeamDialog} onOpenChange={setShowAddTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input 
                id="team-name" 
                placeholder="Enter team name" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Input 
                id="team-description" 
                placeholder="Enter team description" 
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-leader">Team Leader</Label>
              <Select value={newTeamLeader} onValueChange={setNewTeamLeader}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team leader" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeamDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTeam} disabled={addTeamMutation.isPending}>
              {addTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name *</Label>
              <Input 
                id="member-name" 
                placeholder="Enter member name" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role *</Label>
              <Input 
                id="member-role" 
                placeholder="Enter member role" 
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-skills">Skills (comma-separated)</Label>
              <Input 
                id="member-skills" 
                placeholder="Enter skills" 
                value={newMemberSkills}
                onChange={(e) => setNewMemberSkills(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Resource Dialog */}
      <Dialog open={showAllocateResourceDialog} onOpenChange={setShowAllocateResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Resources to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={selectedProject || ""} 
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Resource Type *</Label>
              <Tabs defaultValue="member" className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="member">Team Member</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                <TabsContent value="member" className="pt-2">
                  <Select 
                    value={selectedMemberForAllocation} 
                    onValueChange={(value) => {
                      setSelectedMemberForAllocation(value);
                      setSelectedTeamForAllocation("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="team" className="pt-2">
                  <Select 
                    value={selectedTeamForAllocation} 
                    onValueChange={(value) => {
                      setSelectedTeamForAllocation(value);
                      setSelectedMemberForAllocation("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allocation">Allocation Percentage</Label>
                <Input 
                  id="allocation" 
                  type="number" 
                  min="0"
                  max="100"
                  placeholder="Enter percentage" 
                  value={allocationAmount || ""}
                  onChange={(e) => setAllocationAmount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours Allocated</Label>
                <Input 
                  id="hours" 
                  type="number" 
                  min="0"
                  placeholder="Enter hours" 
                  value={allocatedHours || ""}
                  onChange={(e) => setAllocatedHours(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  value={allocationStartDate}
                  onChange={(e) => setAllocationStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  value={allocationEndDate}
                  onChange={(e) => setAllocationEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocateResourceDialog(false)}>Cancel</Button>
            <Button onClick={handleAllocateResource} disabled={allocateResourceMutation.isPending}>
              {allocateResourceMutation.isPending ? "Allocating..." : "Allocate Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}