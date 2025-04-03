import { useState } from "react";
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
import { useLocation } from "wouter";
import ITAARPanel from "./aar/ITAARPanel";

// Mock data - would be replaced with actual data from API
const activeProjects: ITProject[] = [
  { 
    id: "ITP-001", 
    name: "Manufacturing Execution System Integration", 
    progress: 65, 
    priority: "High", 
    leadEngineer: "Alex Johnson",
    startDate: "2025-02-10",
    endDate: "2025-05-15",
    status: "On Track",
    description: "Integration of shop floor activities with enterprise systems for real-time manufacturing intelligence and control.",
    linkedManufacturingProject: "MFG-2025-001"
  },
  { 
    id: "ITP-002", 
    name: "IoT Sensor Network Deployment", 
    progress: 40, 
    priority: "High", 
    leadEngineer: "Samantha Lee",
    startDate: "2025-03-01",
    endDate: "2025-06-30",
    status: "At Risk",
    description: "Implementation of facility-wide IoT sensor network for machine health monitoring and predictive maintenance."
  },
  { 
    id: "ITP-003", 
    name: "Data Analytics Platform Expansion", 
    progress: 80, 
    priority: "Medium", 
    leadEngineer: "Marcus Chen",
    startDate: "2025-01-15",
    endDate: "2025-04-20",
    status: "On Track",
    description: "Expanding the existing data analytics platform with machine learning capabilities for production optimization."
  },
  { 
    id: "ITP-004", 
    name: "Network Infrastructure Upgrade", 
    progress: 30, 
    priority: "Medium", 
    leadEngineer: "Rachel Kim",
    startDate: "2025-03-10",
    endDate: "2025-07-01",
    status: "On Track",
    description: "Upgrading facility network infrastructure to support increased bandwidth demands and improve security posture."
  },
];

const engineers = [
  { id: "IT-001", name: "Alex Johnson", specialization: "Systems Integration", availability: "Low", activeProjects: 3 },
  { id: "IT-002", name: "Samantha Lee", specialization: "IoT & Embedded Systems", availability: "Medium", activeProjects: 2 },
  { id: "IT-003", name: "Marcus Chen", specialization: "Data Engineering", availability: "Low", activeProjects: 4 },
  { id: "IT-004", name: "Rachel Kim", specialization: "Network Architecture", availability: "High", activeProjects: 1 },
  { id: "IT-005", name: "Daniel Garcia", specialization: "Cybersecurity", availability: "Medium", activeProjects: 2 },
];

interface ITProject {
  id: string;
  name: string;
  progress: number;
  priority: string;
  leadEngineer: string;
  status: string;
  startDate: string;
  endDate: string;
  description?: string;
  linkedManufacturingProject?: string;
}

export default function ITEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");
  const [selectedProject, setSelectedProject] = useState<ITProject | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [, setLocation] = useLocation();
  
  // Handler for viewing project details
  const handleViewDetails = (project: ITProject) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };
  
  // Handler for editing a project
  const handleEditProject = (project: ITProject) => {
    // Navigate to edit project page or open edit dialog
    console.log("Edit project:", project);
  };
  
  // Handler for managing project team
  const handleManageTeam = (project: ITProject) => {
    // Navigate to team management page or open team dialog
    console.log("Manage team for project:", project);
  };
  
  // Handler for exporting project details
  const handleExportDetails = (project: ITProject) => {
    // Logic to export project details to a file
    console.log("Export details for project:", project);
  };
  
  // Handler for navigating to the Manufacturing Module
  const handleViewInManufacturing = (project: ITProject) => {
    if (project.linkedManufacturingProject) {
      setLocation(`/manufacturing?projectId=${project.linkedManufacturingProject}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects.length}</div>
            <p className="text-sm text-muted-foreground">Across various systems</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">99.8%</div>
              <Progress value={99.8} className="h-2 flex-1" />
            </div>
            <p className="text-sm text-muted-foreground">Last 30 days average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Security Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Last 90 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">
            <FontAwesomeIcon icon="project-diagram" className="mr-2 h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="planning">
            <FontAwesomeIcon icon="calendar" className="mr-2 h-4 w-4" />
            Planning
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
                <CardTitle>IT Engineering Projects</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
              <CardDescription>
                View and manage active IT and systems engineering projects
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
                  {activeProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.id}</TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.leadEngineer}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === "On Track" ? "outline" : "destructive"}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="h-2 w-[80px]" />
                          <span className="text-xs">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.priority === "High" ? "default" : "secondary"}>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(project)}>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportDetails(project)}>
                              <FontAwesomeIcon icon="file-export" className="mr-2 h-4 w-4" />
                              Export Details
                            </DropdownMenuItem>
                            {project.linkedManufacturingProject && (
                              <DropdownMenuItem onClick={() => handleViewInManufacturing(project)}>
                                <FontAwesomeIcon icon="industry" className="mr-2 h-4 w-4" />
                                View in Manufacturing
                              </DropdownMenuItem>
                            )}
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
                <CardTitle>Engineering Resources</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                  Add Engineer
                </Button>
              </div>
              <CardDescription>
                View and manage IT engineering team members
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

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Engineering Planning</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="calendar-plus" className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>
              <CardDescription>
                Plan IT engineering activities, resources, and deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Deployments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">MES Phase 1 Deployment</p>
                            <p className="text-sm text-muted-foreground">April 13, 2025 - 2:00 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                        <Separator />
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Network Switch Upgrades</p>
                            <p className="text-sm text-muted-foreground">April 20, 2025 - 1:00 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                        <Separator />
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">IoT Gateway Installation</p>
                            <p className="text-sm text-muted-foreground">April 25, 2025 - 8:00 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resource Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Systems Integration</span>
                            <span>85%</span>
                          </div>
                          <Progress value={85} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>IoT/Embedded</span>
                            <span>75%</span>
                          </div>
                          <Progress value={75} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Data Engineering</span>
                            <span>95%</span>
                          </div>
                          <Progress value={95} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Network Architecture</span>
                            <span>60%</span>
                          </div>
                          <Progress value={60} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">View Detailed Report</Button>
                    </CardFooter>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technology Roadmap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute h-full w-px bg-muted left-7 top-0"></div>
                      <ul className="space-y-4 relative">
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-primary flex items-center justify-center -left-10 top-1">
                            <span className="text-xs text-primary-foreground font-bold">1</span>
                          </div>
                          <h4 className="font-semibold">Requirements Analysis</h4>
                          <p className="text-sm text-muted-foreground">Gathering business and technical requirements</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center -left-10 top-1">
                            <span className="text-xs text-primary-foreground font-bold">2</span>
                          </div>
                          <h4 className="font-semibold">System Architecture</h4>
                          <p className="text-sm text-muted-foreground">Designing system components and interfaces</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">3</span>
                          </div>
                          <h4 className="font-semibold">Development & Testing</h4>
                          <p className="text-sm text-muted-foreground">Building and validating solution components</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">4</span>
                          </div>
                          <h4 className="font-semibold">Integration & Deployment</h4>
                          <p className="text-sm text-muted-foreground">Implementing systems in production environment</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">5</span>
                          </div>
                          <h4 className="font-semibold">Monitoring & Optimization</h4>
                          <p className="text-sm text-muted-foreground">Continuous improvement of deployed systems</p>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aar" className="space-y-4">
          <ITAARPanel />
        </TabsContent>
      </Tabs>
      
      {/* Project Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Detailed information about the IT engineering project
            </DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Project ID</h4>
                  <p className="text-sm">{selectedProject.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Name</h4>
                  <p className="text-sm">{selectedProject.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Lead Engineer</h4>
                  <p className="text-sm">{selectedProject.leadEngineer}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <Badge variant={selectedProject.status === "On Track" ? "outline" : "destructive"}>
                    {selectedProject.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Priority</h4>
                  <Badge variant={
                    selectedProject.priority === "Critical" ? "destructive" :
                    selectedProject.priority === "High" ? "default" : "secondary"
                  }>
                    {selectedProject.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Progress</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedProject.progress} className="h-2 w-[100px]" />
                    <span className="text-xs">{selectedProject.progress}%</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Start Date</h4>
                  <p className="text-sm">{selectedProject.startDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">End Date</h4>
                  <p className="text-sm">{selectedProject.endDate}</p>
                </div>
              </div>
              
              {selectedProject.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                </div>
              )}
              
              {selectedProject.linkedManufacturingProject && (
                <div className="flex flex-col space-y-2">
                  <h4 className="text-sm font-medium mb-1">Linked Manufacturing Project</h4>
                  <p className="text-sm">{selectedProject.linkedManufacturingProject}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="self-start"
                    onClick={() => handleViewInManufacturing(selectedProject)}
                  >
                    <FontAwesomeIcon icon="external-link" className="mr-2 h-4 w-4" />
                    View in Manufacturing Module
                  </Button>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="text-sm font-medium mb-2">Technical Details</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium mb-1">System Type</h4>
                      <p className="text-sm">Enterprise Integration</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1">Technology Stack</h4>
                      <p className="text-sm">Node.js, Azure Services, SQL</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1">Deployment Method</h4>
                      <p className="text-sm">CI/CD Pipeline</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1">Estimated Resources</h4>
                      <p className="text-sm">3 Engineers, 850 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
            <Button onClick={() => handleEditProject(selectedProject!)}>
              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}