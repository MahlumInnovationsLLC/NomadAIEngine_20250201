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
import MechanicalAARPanel from "./aar/MechanicalAARPanel";
import { RedlineProvider } from "./redline/RedlineContext";
import DepartmentRedlinePanel from "./redline/DepartmentRedlinePanel";

// Mock data for Mechanical engineering projects
const projects = [
  { 
    id: "M-001", 
    name: "Automated Material Handling System", 
    progress: 65, 
    priority: "High", 
    leadEngineer: "Robert Taylor",
    status: "On Track",
    startDate: "2025-01-10",
    endDate: "2025-05-15",
    description: "Installing new automated material handling system for the assembly line",
    engineeringType: "Mechanical",
    linkedManufacturingProject: "MFG-2025-003",
    projectNumber: "MECH-2025-001"
  },
  { 
    id: "M-002", 
    name: "HVAC System Optimization", 
    progress: 85, 
    priority: "Medium", 
    leadEngineer: "Emily Cruz",
    status: "On Track",
    startDate: "2024-12-05",
    endDate: "2025-03-30",
    description: "Optimizing HVAC systems for energy efficiency and improved climate control",
    engineeringType: "Mechanical",
    projectNumber: "MECH-2025-002"
  },
  { 
    id: "M-003", 
    name: "CNC Machine Retrofit", 
    progress: 45, 
    priority: "High", 
    leadEngineer: "James Wilson",
    status: "At Risk",
    startDate: "2025-02-01",
    endDate: "2025-07-15",
    description: "Retrofitting legacy CNC machines with modern control systems",
    engineeringType: "Mechanical",
    linkedManufacturingProject: "MFG-2025-015",
    projectNumber: "MECH-2025-003"
  },
  { 
    id: "M-004", 
    name: "Precision Alignment Jigs Design", 
    progress: 70, 
    priority: "Medium", 
    leadEngineer: "Lisa Reynolds",
    status: "On Track",
    startDate: "2025-01-20",
    endDate: "2025-04-10",
    description: "Designing custom precision alignment jigs for the new product line",
    engineeringType: "Mechanical",
    projectNumber: "MECH-2025-004"
  },
  { 
    id: "M-005", 
    name: "Pneumatic System Upgrade", 
    progress: 30, 
    priority: "Medium", 
    leadEngineer: "Robert Taylor",
    status: "On Track",
    startDate: "2025-02-15",
    endDate: "2025-06-30",
    description: "Upgrading plant-wide pneumatic systems for improved reliability and efficiency",
    engineeringType: "Mechanical",
    projectNumber: "MECH-2025-005"
  }
];

// Mock data for engineers
const engineers = [
  { id: "ME-001", name: "Robert Taylor", specialization: "Automation Systems", availability: "Low", activeProjects: 2 },
  { id: "ME-002", name: "Emily Cruz", specialization: "HVAC & Building Systems", availability: "Medium", activeProjects: 1 },
  { id: "ME-003", name: "James Wilson", specialization: "CNC & Precision Machining", availability: "Low", activeProjects: 2 },
  { id: "ME-004", name: "Lisa Reynolds", specialization: "Tooling & Fixtures", availability: "Medium", activeProjects: 1 },
  { id: "ME-005", name: "Alan Jackson", specialization: "Hydraulics & Pneumatics", availability: "High", activeProjects: 0 },
];

// Mock data for equipment
const equipment = [
  { id: "ME-EQ-001", name: "Vibration Analysis Kit", status: "Available", lastCalibration: "2025-01-05", nextCalibration: "2025-07-05" },
  { id: "ME-EQ-002", name: "3D Scanner", status: "In Use", lastCalibration: "2024-12-10", nextCalibration: "2025-06-10" },
  { id: "ME-EQ-003", name: "Alignment Laser System", status: "Maintenance", lastCalibration: "2024-11-15", nextCalibration: "2025-05-15" },
  { id: "ME-EQ-004", name: "Torque Wrenches (Calibrated Set)", status: "Available", lastCalibration: "2025-02-01", nextCalibration: "2025-08-01" },
  { id: "ME-EQ-005", name: "Thermal Imaging Camera", status: "Available", lastCalibration: "2025-01-25", nextCalibration: "2025-07-25" },
];

// Define an interface for mechanical engineering projects
interface MechanicalProject {
  id: string;
  name: string;
  description?: string;
  projectNumber?: string;
  progress: number;
  priority: string;
  leadEngineer: string;
  status: string;
  startDate: string;
  endDate: string;
  engineeringType?: string;
  linkedManufacturingProject?: string;
}

export default function MechanicalEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");
  const [selectedProject, setSelectedProject] = useState<MechanicalProject | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [, setLocation] = useLocation();
  
  // Handler for viewing project details
  const handleViewDetails = (project: MechanicalProject) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };
  
  // Handler for editing a project
  const handleEditProject = (project: MechanicalProject) => {
    // Navigate to edit project page or open edit dialog
    console.log("Edit project:", project);
  };
  
  // Handler for managing project team
  const handleManageTeam = (project: MechanicalProject) => {
    // Navigate to team management page or open team dialog
    console.log("Manage team for project:", project);
  };
  
  // Handler for exporting project details
  const handleExportDetails = (project: MechanicalProject) => {
    // Logic to export project details to a file
    console.log("Export details for project:", project);
  };
  
  // Handler for navigating to the Manufacturing Module
  const handleViewInManufacturing = (project: MechanicalProject) => {
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
            <div className="text-3xl font-bold">{projects.length}</div>
            <p className="text-sm text-muted-foreground">Mechanical engineering initiatives</p>
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="redlines">
            <FontAwesomeIcon icon="pencil-ruler" className="mr-2 h-4 w-4" />
            Redlines
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
                <CardTitle>Mechanical Engineering Projects</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
              <CardDescription>
                Manage ongoing mechanical engineering projects and initiatives
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
                  {projects.map((project) => (
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
                <CardTitle>Mechanical Engineering Team</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                  Add Engineer
                </Button>
              </div>
              <CardDescription>
                View and manage mechanical engineering personnel resources
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
                <CardTitle>Mechanical Test Equipment</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
              <CardDescription>
                Manage mechanical testing, measurement, and maintenance equipment
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

        <TabsContent value="redlines" className="space-y-4">
          <RedlineProvider>
            <DepartmentRedlinePanel department="Mechanical" />
          </RedlineProvider>
        </TabsContent>

        <TabsContent value="aar" className="space-y-4">
          <MechanicalAARPanel />
        </TabsContent>
      </Tabs>
      
      {/* Project Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Detailed information about the mechanical engineering project
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
                  <p className="text-sm">{selectedProject.description}</p>
                </div>
              )}
              
              {selectedProject.linkedManufacturingProject && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Linked Manufacturing Project</h4>
                  <p className="text-sm">{selectedProject.linkedManufacturingProject}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            {selectedProject?.linkedManufacturingProject && (
              <Button variant="outline" onClick={() => handleViewInManufacturing(selectedProject)}>
                <FontAwesomeIcon icon="industry" className="mr-2 h-4 w-4" />
                View in Manufacturing
              </Button>
            )}
            <Button variant="outline" onClick={() => selectedProject && handleEditProject(selectedProject)}>
              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}