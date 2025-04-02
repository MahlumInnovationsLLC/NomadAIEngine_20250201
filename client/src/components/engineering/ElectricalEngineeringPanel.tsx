import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types/manufacturing";
import ElectricalAARPanel from "./aar/ElectricalAARPanel";
import { useLocation } from "wouter";

// Interface for engineering projects, enhanced with electrical-specific fields
interface EngineeringProject {
  id: string;
  name: string;
  description?: string;
  projectNumber?: string;
  progress: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  leadEngineer: string;
  status: string;
  startDate: string;
  endDate: string;
  engineeringType: "Electrical" | "Mechanical" | "IT" | "NTC";
  eeDesignProgress?: string | number;
  eeAssigned?: string;
  maintenanceRecords?: {
    date: string;
    description: string;
    technician: string;
  }[];
  linkedManufacturingProject?: string; // ID of linked manufacturing project
}

// Data for engineers
const engineers = [
  { id: "EE-001", name: "Sarah Johnson", specialization: "Power Systems", availability: "Low", activeProjects: 3 },
  { id: "EE-002", name: "Michael Chen", specialization: "Control Systems", availability: "Low", activeProjects: 2 },
  { id: "EE-003", name: "Jessica Williams", specialization: "Lighting & Energy Efficiency", availability: "Medium", activeProjects: 1 },
  { id: "EE-004", name: "David Lee", specialization: "Automation & PLC", availability: "Medium", activeProjects: 2 },
  { id: "EE-005", name: "Alex Rodriguez", specialization: "Electrical Safety Systems", availability: "High", activeProjects: 0 },
];

// Data for equipment
const equipment = [
  { id: "EQ-001", name: "Fluke 289 Multimeter", status: "Available", lastCalibration: "2025-01-10", nextCalibration: "2025-07-10" },
  { id: "EQ-002", name: "Thermal Imaging Camera", status: "In Use", lastCalibration: "2024-12-15", nextCalibration: "2025-06-15" },
  { id: "EQ-003", name: "Power Quality Analyzer", status: "Available", lastCalibration: "2025-02-05", nextCalibration: "2025-08-05" },
  { id: "EQ-004", name: "Cable Tester", status: "Maintenance", lastCalibration: "2024-11-20", nextCalibration: "2025-05-20" },
  { id: "EQ-005", name: "Portable Generator", status: "Available", lastCalibration: "2025-01-30", nextCalibration: "2025-07-30" },
];

// Predefined engineering projects with detailed information
const engineeringProjects: EngineeringProject[] = [
  { 
    id: "E-001", 
    name: "Main Assembly Line Electrical Upgrade", 
    progress: 75, 
    priority: "High", 
    leadEngineer: "Sarah Johnson",
    status: "On Track",
    startDate: "2025-01-15",
    endDate: "2025-04-30",
    engineeringType: "Electrical",
    description: "Upgrading electrical systems on the main assembly line to support new robotic equipment"
  },
  { 
    id: "E-002", 
    name: "Backup Generator Implementation", 
    progress: 30, 
    priority: "Critical", 
    leadEngineer: "Michael Chen",
    status: "At Risk",
    startDate: "2025-02-01",
    endDate: "2025-05-15",
    engineeringType: "Electrical",
    description: "Installing new backup power generation system for critical manufacturing operations"
  },
  { 
    id: "E-003", 
    name: "Factory Lighting Modernization", 
    progress: 90, 
    priority: "Medium", 
    leadEngineer: "Jessica Williams",
    status: "On Track",
    startDate: "2024-12-01",
    endDate: "2025-03-15",
    engineeringType: "Electrical",
    description: "Replacing factory lighting with energy-efficient LED systems and smart controls"
  },
  { 
    id: "E-004", 
    name: "Control System Upgrade - Line 3", 
    progress: 60, 
    priority: "Medium", 
    leadEngineer: "David Lee",
    status: "On Track",
    startDate: "2025-01-10",
    endDate: "2025-03-30",
    engineeringType: "Electrical",
    description: "Upgrading control systems on production line 3 with new PLCs and HMI"
  },
  { 
    id: "E-005", 
    name: "Power Distribution Redesign", 
    progress: 45, 
    priority: "High", 
    leadEngineer: "Sarah Johnson",
    status: "On Track",
    startDate: "2025-02-15",
    endDate: "2025-06-01",
    engineeringType: "Electrical",
    description: "Redesigning power distribution for eastern manufacturing section to improve efficiency and capacity"
  }
];

export default function ElectricalEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");
  const [linkedProjects, setLinkedProjects] = useState<EngineeringProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<EngineeringProject | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch manufacturing projects
  const { data: manufacturingProjects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/manufacturing/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch manufacturing projects');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching manufacturing projects:", error);
        return [];
      }
    },
  });

  // Process and link engineering projects with manufacturing projects
  useEffect(() => {
    if (manufacturingProjects.length > 0) {
      // Filter manufacturing projects with electrical engineering involvement
      const relevantProjects = manufacturingProjects.filter(
        project => project.eeDesignProgress !== undefined && 
                  project.eeDesignProgress !== null && 
                  project.eeAssigned !== undefined
      );

      // Create linked engineering projects
      const linked = engineeringProjects.map(engProject => {
        // Try to find a matching manufacturing project
        const matchingProject = relevantProjects.find(
          mp => mp.name?.includes(engProject.name) || 
                engProject.name.includes(mp.name || "") ||
                mp.projectNumber === engProject.projectNumber
        );

        // If found, link the projects
        if (matchingProject) {
          return {
            ...engProject,
            linkedManufacturingProject: matchingProject.id,
            projectNumber: matchingProject.projectNumber || engProject.projectNumber,
            eeDesignProgress: matchingProject.eeDesignProgress,
            eeAssigned: matchingProject.eeAssigned
          };
        }
        return engProject;
      });

      setLinkedProjects(linked);
    } else {
      setLinkedProjects(engineeringProjects);
    }
  }, [manufacturingProjects]);

  // Get projects to display - either linked or original
  const displayProjects = linkedProjects.length > 0 ? linkedProjects : engineeringProjects;

  // View project details and link to manufacturing project
  const handleViewProject = (project: EngineeringProject) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  // Link project to manufacturing project
  const handleLinkProject = (project: EngineeringProject) => {
    setSelectedProject(project);
    setShowLinkDialog(true);
  };
  
  // Navigate to manufacturing module to view project
  const handleViewInManufacturing = (projectId: string) => {
    setShowDetailsDialog(false);
    setLocation(`/manufacturing?projectId=${projectId}`);
  };
  
  // Edit project handler
  const handleEditProject = (project: EngineeringProject) => {
    // For now, we'll just show the details dialog
    // In a real implementation, this would open an edit form
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };
  
  // Manage team handler 
  const handleManageTeam = (project: EngineeringProject) => {
    // In a real implementation, this would open a team management dialog
    console.log("Managing team for project:", project.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{displayProjects.length}</div>
            <p className="text-sm text-muted-foreground">Electrical engineering initiatives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Engineers Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{engineers.filter(e => e.availability !== "Low").length}</div>
            <p className="text-sm text-muted-foreground">Out of {engineers.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Equipment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{equipment.filter(e => e.status === "Available").length}</div>
            <p className="text-sm text-muted-foreground">Items available for use</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">
            <FontAwesomeIcon icon="tasks" className="mr-2 h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <FontAwesomeIcon icon="tools" className="mr-2 h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="aar">
            <FontAwesomeIcon icon="clipboard-check" className="mr-2 h-4 w-4" />
            AAR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Electrical Engineering Projects</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
              <CardDescription>
                Manage ongoing electrical engineering projects and initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Lead Engineer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.projectNumber || project.id}
                        {project.linkedManufacturingProject && (
                          <Badge variant="outline" className="ml-2">Linked</Badge>
                        )}
                      </TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.leadEngineer}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === "On Track" ? "outline" : "destructive"}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={
                              project.eeDesignProgress && typeof project.eeDesignProgress === 'number' 
                                ? project.eeDesignProgress 
                                : project.progress
                            } 
                            className="h-2 w-[80px]" 
                          />
                          <span className="text-xs">
                            {project.eeDesignProgress && typeof project.eeDesignProgress === 'number' 
                              ? project.eeDesignProgress 
                              : project.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          project.priority === "Critical" ? "destructive" :
                          project.priority === "High" ? "default" : "secondary"
                        }>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.endDate}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProject(project)}>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageTeam(project)}>
                              <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
                              Manage Team
                            </DropdownMenuItem>
                            {!project.linkedManufacturingProject && (
                              <DropdownMenuItem onClick={() => handleLinkProject(project)}>
                                <FontAwesomeIcon icon="link" className="mr-2 h-4 w-4" />
                                Link to Manufacturing
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <FontAwesomeIcon icon="file-export" className="mr-2 h-4 w-4" />
                              Export Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Electrical Engineering Team</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                  Add Engineer
                </Button>
              </div>
              <CardDescription>
                View and manage electrical engineering personnel resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Active Projects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engineers.map((engineer) => (
                    <TableRow key={engineer.id}>
                      <TableCell className="font-medium">{engineer.id}</TableCell>
                      <TableCell>{engineer.name}</TableCell>
                      <TableCell>{engineer.specialization}</TableCell>
                      <TableCell>
                        <Badge variant={
                          engineer.availability === "High" ? "outline" : 
                          engineer.availability === "Medium" ? "secondary" : "destructive"
                        }>
                          {engineer.availability}
                        </Badge>
                      </TableCell>
                      <TableCell>{engineer.activeProjects}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="user-edit" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="tasks" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Electrical Test Equipment</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
              <CardDescription>
                Manage electrical testing and maintenance equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Calibration</TableHead>
                    <TableHead>Next Calibration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.status === "Available" ? "outline" : 
                          item.status === "In Use" ? "secondary" : "destructive"
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.lastCalibration}</TableCell>
                      <TableCell>{item.nextCalibration}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="calendar" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aar" className="space-y-4">
          <ElectricalAARPanel />
        </TabsContent>
      </Tabs>

      {/* Project Details Dialog */}
      {selectedProject && showDetailsDialog && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon="bolt" className="text-yellow-500" />
                {selectedProject.name}
                {selectedProject.linkedManufacturingProject && (
                  <Badge variant="outline" className="ml-2">Linked to Manufacturing</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Project Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID:</span>
                    <span className="text-sm font-medium">{selectedProject.projectNumber || selectedProject.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lead Engineer:</span>
                    <span className="text-sm font-medium">{selectedProject.leadEngineer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Start Date:</span>
                    <span className="text-sm font-medium">{selectedProject.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End Date:</span>
                    <span className="text-sm font-medium">{selectedProject.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    <Badge variant={
                      selectedProject.priority === "Critical" ? "destructive" :
                      selectedProject.priority === "High" ? "default" : "secondary"
                    }>{selectedProject.priority}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={selectedProject.status === "On Track" ? "outline" : "destructive"}>
                      {selectedProject.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Progress</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Overall Progress:</span>
                      <span className="text-sm font-medium">
                        {selectedProject.progress}%
                      </span>
                    </div>
                    <Progress value={selectedProject.progress} className="h-2" />
                  </div>
                  
                  {selectedProject.linkedManufacturingProject && selectedProject.eeDesignProgress && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Design Progress:</span>
                        <span className="text-sm font-medium">
                          {typeof selectedProject.eeDesignProgress === 'number' 
                            ? `${selectedProject.eeDesignProgress}%` 
                            : selectedProject.eeDesignProgress}
                        </span>
                      </div>
                      {typeof selectedProject.eeDesignProgress === 'number' && (
                        <Progress value={selectedProject.eeDesignProgress} className="h-2" />
                      )}
                    </div>
                  )}
                </div>
                
                <h4 className="text-sm font-medium mt-4 mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
              </div>
            </div>
            
            {selectedProject.linkedManufacturingProject && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Manufacturing Information</h4>
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Manufacturing Project ID:</span>
                    <span className="text-sm font-medium">{selectedProject.linkedManufacturingProject}</span>
                  </div>
                  {selectedProject.eeAssigned && (
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-muted-foreground">Assigned Engineer:</span>
                      <span className="text-sm font-medium">{selectedProject.eeAssigned}</span>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => handleViewInManufacturing(selectedProject.linkedManufacturingProject)}
                  >
                    <FontAwesomeIcon icon="external-link" className="mr-2 h-4 w-4" />
                    View in Manufacturing Module
                  </Button>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
              <Button onClick={() => handleEditProject(selectedProject)}>
                <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Link Project Dialog */}
      {selectedProject && showLinkDialog && (
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Link to Manufacturing Project</DialogTitle>
              <DialogDescription>
                Connect this electrical engineering project to an existing manufacturing project
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md mb-2">
                <h4 className="text-sm font-medium mb-1">Engineering Project</h4>
                <p className="text-sm">{selectedProject.name}</p>
                <p className="text-xs text-muted-foreground">ID: {selectedProject.id}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Select a Manufacturing Project</h4>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingProjects ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            <FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
                            Loading projects...
                          </TableCell>
                        </TableRow>
                      ) : manufacturingProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No manufacturing projects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        manufacturingProjects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.projectNumber}</TableCell>
                            <TableCell>{project.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // Logic to link the selected project with the manufacturing project
                                  const updated = linkedProjects.map(p => {
                                    if (p.id === selectedProject.id) {
                                      return {
                                        ...p,
                                        linkedManufacturingProject: project.id,
                                        projectNumber: project.projectNumber || p.projectNumber,
                                        eeDesignProgress: project.eeDesignProgress,
                                        eeAssigned: project.eeAssigned
                                      };
                                    }
                                    return p;
                                  });
                                  setLinkedProjects(updated);
                                  setShowLinkDialog(false);
                                }}
                              >
                                Link
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}