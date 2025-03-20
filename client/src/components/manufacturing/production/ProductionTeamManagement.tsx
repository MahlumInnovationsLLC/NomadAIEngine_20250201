import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserPlus, 
  UserCog, 
  UserMinus, 
  Clipboard, 
  ArrowRight,
  PlusCircle,
  Settings,
  AlertCircle,
  Edit,
  ListPlus,
  Info,
  HardHat, 
  Brain,
  Wrench
} from "lucide-react";
import { ProductionLine, TeamMember, Project } from "@/types/manufacturing";
import { TeamMemberManagement } from "./TeamMemberManagement";
import { ProductionLineDialog } from "./ProductionLineDialog";
import { ProjectAssignmentDialog } from "./ProjectAssignmentDialog";
import { TeamLeadAssignmentDialog } from "./TeamLeadAssignmentDialog";
import { TeamAnalyticsSection } from "./TeamAnalyticsSection";
import { TeamNeedsSection } from "./TeamNeedsSection";

interface ProductionTeamManagementProps {
  productionLines?: ProductionLine[];
  standalonePage?: boolean;
}

export function ProductionTeamManagement({ productionLines = [], standalonePage = false }: ProductionTeamManagementProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
  const [teamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [projectAssignDialogOpen, setProjectAssignDialogOpen] = useState(false);
  const [teamDetailsDialogOpen, setTeamDetailsDialogOpen] = useState(false);
  const [teamLeadDialogOpen, setTeamLeadDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production lines if not provided
  const { data: fetchedProductionLines = [], isLoading, error } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    enabled: standalonePage || productionLines.length === 0,
    queryFn: async () => {
      return await apiGet<ProductionLine[]>('/api/manufacturing/production-lines');
    }
  });

  // Use fetched lines if in standalone mode, otherwise use provided lines
  const allProductionLines = standalonePage ? fetchedProductionLines : productionLines;

  // Get only production lines with team information
  const linesWithTeams = allProductionLines.filter(
    line => line.electricalLead || line.assemblyLead || (line.teamMembers && line.teamMembers.length > 0)
  );

  // Get lines by status for tab filtering
  const operationalLines = allProductionLines.filter(line => line.status === 'operational');
  const maintenanceLines = allProductionLines.filter(line => line.status === 'maintenance');
  const offlineLines = allProductionLines.filter(line => line.status === 'offline');

  // Fetch projects for assignment
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    enabled: standalonePage,
    queryFn: async () => {
      return await apiGet<Project[]>('/api/manufacturing/projects');
    }
  });
  
  // Fetch all available team members for assignment
  const { data: availableMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/manufacturing/team-members'],
    enabled: standalonePage || teamLeadDialogOpen,
    queryFn: async () => {
      return await apiGet<TeamMember[]>('/api/manufacturing/team-members');
    }
  });

  // Function to filter production lines based on active tab
  const getFilteredLines = () => {
    switch (activeTab) {
      case "operational":
        return operationalLines;
      case "maintenance":
        return maintenanceLines;
      case "offline":
        return offlineLines;
      case "withTeams":
        return linesWithTeams;
      default:
        return allProductionLines;
    }
  };

  // Function to get initials from a name
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get a color based on a string value (for consistent avatar colors)
  const getColorFromString = (str: string) => {
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500"
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Function to handle opening the team member management dialog
  const handleManageTeamMembers = (line: ProductionLine) => {
    setSelectedLine(line);
    setTeamMemberDialogOpen(true);
  };

  // Function to handle opening the project assignment dialog
  const handleAssignProjects = (line: ProductionLine) => {
    setSelectedLine(line);
    setProjectAssignDialogOpen(true);
  };

  // Function to handle opening the team details dialog
  const handleViewTeamDetails = (line: ProductionLine) => {
    setSelectedLine(line);
    setTeamDetailsDialogOpen(true);
  };

  // Function to handle creating a new team
  const handleCreateTeam = () => {
    setCreateTeamDialogOpen(true);
  };
  
  // Function to handle opening the team lead assignment dialog
  const handleAssignTeamLeads = (line: ProductionLine) => {
    setSelectedLine(line);
    setTeamLeadDialogOpen(true);
  };

  if (isLoading && standalonePage) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && standalonePage) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Teams</h3>
        <p className="text-muted-foreground">
          There was a problem loading the production teams. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {standalonePage && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Production Team Management</h1>
            <p className="text-muted-foreground">
              Manage production teams, assign projects, and track team performance
            </p>
          </div>
          <Button onClick={handleCreateTeam}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Team
          </Button>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All Teams</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="withTeams">Active Teams</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredLines().length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-60">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Production Teams Found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all" 
                    ? "Start by creating your first production team"
                    : "No teams match the selected filter"}
                </p>
                {activeTab === "all" && (
                  <Button onClick={handleCreateTeam}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Team
                  </Button>
                )}
              </div>
            </div>
          ) : (
            getFilteredLines().map(line => (
              <Card key={line.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{line.teamName || line.name}</CardTitle>
                      <CardDescription>
                        {line.type} line - {line.status}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={line.status === 'operational' ? 'default' : 
                              line.status === 'maintenance' ? 'warning' : 'destructive'}
                    >
                      {line.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Team leads section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Team Leads</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleAssignTeamLeads(line)}>
                        <HardHat className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Electrical Lead */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex items-center space-x-3">
                          {line.electricalLead ? (
                            <>
                              <Avatar className={getColorFromString(line.electricalLead.name)}>
                                <AvatarFallback>{getInitials(line.electricalLead.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{line.electricalLead.name}</div>
                                <div className="text-xs text-muted-foreground">Electrical Lead</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <Avatar className="bg-muted">
                                <AvatarFallback>EL</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-muted-foreground">No Electrical Lead</div>
                                <div className="text-xs">Not assigned</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Assembly Lead */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex items-center space-x-3">
                          {line.assemblyLead ? (
                            <>
                              <Avatar className={getColorFromString(line.assemblyLead.name)}>
                                <AvatarFallback>{getInitials(line.assemblyLead.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{line.assemblyLead.name}</div>
                                <div className="text-xs text-muted-foreground">Assembly Lead</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <Avatar className="bg-muted">
                                <AvatarFallback>AL</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-muted-foreground">No Assembly Lead</div>
                                <div className="text-xs">Not assigned</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team members section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Team Members</h4>
                      <div className="text-sm">
                        {line.teamMembers?.length || 0}/{line.manpowerCapacity || 10}
                      </div>
                    </div>
                    
                    {line.teamMembers && line.teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {line.teamMembers.slice(0, 5).map((member, index) => (
                          <Avatar key={index} title={member.name} className={getColorFromString(member.name)}>
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {line.teamMembers.length > 5 && (
                          <Avatar className="bg-muted">
                            <AvatarFallback>+{line.teamMembers.length - 5}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2">
                        No team members have been assigned yet
                      </div>
                    )}
                  </div>

                  {/* Team projects section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Assigned Projects</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleAssignProjects(line)}>
                        <ListPlus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                    
                    {line.assignedProjects && line.assignedProjects.length > 0 ? (
                      <div className="space-y-2">
                        {projects
                          .filter(p => line.assignedProjects?.includes(p.id))
                          .slice(0, 2)
                          .map(project => (
                            <div key={project.id} className="bg-muted/30 p-2 rounded text-sm flex justify-between">
                              <div>{project.projectNumber || project.name}</div>
                              <Badge variant="outline" className="text-xs">
                                {project.status}
                              </Badge>
                            </div>
                          ))}
                        {line.assignedProjects.length > 2 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs" 
                            onClick={() => handleViewTeamDetails(line)}
                          >
                            View all {line.assignedProjects.length} projects
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2">
                        No projects assigned to this team
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 pt-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleManageTeamMembers(line)}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleViewTeamDetails(line)}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Team Details
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>

      {/* Team Creation Dialog */}
      {selectedLine && (
        <ProductionLineDialog
          open={createTeamDialogOpen}
          onOpenChange={setCreateTeamDialogOpen}
          productionLine={null}
          isEditing={false}
        />
      )}

      {/* Project Assignment Dialog */}
      {selectedLine && (
        <ProjectAssignmentDialog
          open={projectAssignDialogOpen}
          onOpenChange={setProjectAssignDialogOpen}
          productionLine={selectedLine}
          projects={projects}
        />
      )}

      {/* Team Lead Assignment Dialog */}
      {selectedLine && (
        <TeamLeadAssignmentDialog
          open={teamLeadDialogOpen}
          onOpenChange={setTeamLeadDialogOpen}
          productionLine={selectedLine}
          availableMembers={availableMembers}
        />
      )}

      {/* Team Details Dialog */}
      {selectedLine && (
        <Dialog open={teamDetailsDialogOpen} onOpenChange={setTeamDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLine.teamName || selectedLine.name} Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about this production team
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="info">Team Info</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="needs">Team Needs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6">
                {/* Team info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Team Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Line Name</Label>
                      <div className="font-medium">{selectedLine.name}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Team Name</Label>
                      <div className="font-medium">{selectedLine.teamName || "Not set"}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="font-medium uppercase">{selectedLine.status}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <div className="font-medium capitalize">{selectedLine.type}</div>
                    </div>
                  </div>
                </div>

                {/* Team leads */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Team Leadership</h3>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssignTeamLeads(selectedLine)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Assign Leads
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <Label className="text-muted-foreground">Electrical Lead</Label>
                      <div className="flex items-center mt-2">
                        <Avatar className={selectedLine.electricalLead ? getColorFromString(selectedLine.electricalLead.name) : "bg-muted"}>
                          <AvatarFallback>
                            {selectedLine.electricalLead ? getInitials(selectedLine.electricalLead.name) : "EL"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="font-medium">
                            {selectedLine.electricalLead ? selectedLine.electricalLead.name : "Not assigned"}
                          </div>
                          {selectedLine.electricalLead?.email && (
                            <div className="text-xs text-muted-foreground">{selectedLine.electricalLead.email}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <Label className="text-muted-foreground">Assembly Lead</Label>
                      <div className="flex items-center mt-2">
                        <Avatar className={selectedLine.assemblyLead ? getColorFromString(selectedLine.assemblyLead.name) : "bg-muted"}>
                          <AvatarFallback>
                            {selectedLine.assemblyLead ? getInitials(selectedLine.assemblyLead.name) : "AL"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <div className="font-medium">
                            {selectedLine.assemblyLead ? selectedLine.assemblyLead.name : "Not assigned"}
                          </div>
                          {selectedLine.assemblyLead?.email && (
                            <div className="text-xs text-muted-foreground">{selectedLine.assemblyLead.email}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team name formation info */}
                  {selectedLine.teamName && (selectedLine.electricalLead || selectedLine.assemblyLead) && (
                    <div className="text-sm bg-secondary/20 p-3 rounded-md mt-2">
                      <div className="flex items-center">
                        <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          Team name <span className="font-semibold">{selectedLine.teamName}</span> is derived from the leads' last names.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Performance Metrics */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Team Performance</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground">Efficiency</div>
                      <div className="text-xl font-bold">
                        {selectedLine.performance?.efficiency 
                          ? `${Math.round(selectedLine.performance.efficiency * 100)}%` 
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground">Quality</div>
                      <div className="text-xl font-bold">
                        {selectedLine.performance?.quality 
                          ? `${Math.round(selectedLine.performance.quality * 100)}%` 
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground">Availability</div>
                      <div className="text-xl font-bold">
                        {selectedLine.performance?.availability 
                          ? `${Math.round(selectedLine.performance.availability * 100)}%` 
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground">OEE</div>
                      <div className="text-xl font-bold">
                        {selectedLine.performance?.oee 
                          ? `${Math.round(selectedLine.performance.oee * 100)}%` 
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned projects */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Assigned Projects</h3>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTeamDetailsDialogOpen(false);
                        setTimeout(() => handleAssignProjects(selectedLine), 100);
                      }}
                    >
                      <ListPlus className="h-4 w-4 mr-2" />
                      Manage Projects
                    </Button>
                  </div>
                  
                  {selectedLine.assignedProjects && selectedLine.assignedProjects.length > 0 ? (
                    <div className="bg-muted/30 p-3 rounded-md space-y-2 max-h-[200px] overflow-y-auto">
                      {projects
                        .filter(p => selectedLine.assignedProjects?.includes(p.id))
                        .map(project => (
                          <div key={project.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <div>
                              <div className="font-medium">{project.projectNumber || project.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>Location: {project.location || 'Unknown'}</span>
                                <span>•</span>
                                <span>
                                  Due: {
                                    project.delivery ? 
                                    new Date(project.delivery).toLocaleDateString() : 
                                    'Not set'
                                  }
                                </span>
                              </div>
                            </div>
                            <Badge variant={
                              project.status === 'COMPLETED' ? 'default' :
                              project.status === 'IN_QC' ? 'warning' :
                              'outline'
                            }>
                              {project.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-muted/30 p-4 rounded-md text-center">
                      <p className="text-muted-foreground">No projects assigned to this team</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setTeamDetailsDialogOpen(false);
                          setTimeout(() => handleAssignProjects(selectedLine), 100);
                        }}
                      >
                        <ListPlus className="h-4 w-4 mr-2" />
                        Assign Projects
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="members" className="space-y-6">
                {/* Team members section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Team Members</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleManageTeamMembers(selectedLine)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                  </div>
                  
                  {selectedLine.teamMembers && selectedLine.teamMembers.length > 0 ? (
                    <div className="space-y-3">
                      {selectedLine.teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md border">
                          <div className="flex items-center gap-3">
                            <Avatar className={getColorFromString(member.name)}>
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{member.role}</span>
                                {member.email && (
                                  <>
                                    <span>•</span>
                                    <span>{member.email}</span>
                                  </>
                                )}
                                {member.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{member.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="whitespace-nowrap">
                              {member.yearsExperience ? `${member.yearsExperience} years exp` : "New hire"}
                            </Badge>
                            {member.department && (
                              <Badge variant="secondary" className="whitespace-nowrap">
                                {member.department}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-muted/20 rounded-md">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Team Members Yet</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        This team doesn't have any members assigned yet.
                      </p>
                      <Button 
                        variant="default" 
                        onClick={() => handleManageTeamMembers(selectedLine)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Team Members
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <TeamAnalyticsSection 
                  productionLine={selectedLine} 
                  projects={projects}
                  isExpanded={true}
                />
              </TabsContent>
              
              <TabsContent value="needs" className="space-y-6">
                <TeamNeedsSection 
                  productionLine={selectedLine} 
                  projects={projects}
                  isExpanded={true}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setTeamDetailsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => handleManageTeamMembers(selectedLine)}>
                <UserCog className="h-4 w-4 mr-2" />
                Manage Team Members
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Member Management Dialog */}
      {selectedLine && (
        <TeamMemberManagement
          open={teamMemberDialogOpen}
          onOpenChange={setTeamMemberDialogOpen}
          productionLine={selectedLine}
        />
      )}
    </div>
  );
}