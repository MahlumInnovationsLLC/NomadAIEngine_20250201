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
import ElectricalAARPanel from "./aar/ElectricalAARPanel";

// Mock data for Electrical engineering projects
const projects = [
  { 
    id: "E-001", 
    name: "Main Assembly Line Electrical Upgrade", 
    progress: 75, 
    priority: "High", 
    leadEngineer: "Sarah Johnson",
    status: "On Track",
    startDate: "2025-01-15",
    endDate: "2025-04-30",
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
    description: "Redesigning power distribution for eastern manufacturing section to improve efficiency and capacity"
  }
];

// Mock data for engineers
const engineers = [
  { id: "EE-001", name: "Sarah Johnson", specialization: "Power Systems", availability: "Low", activeProjects: 3 },
  { id: "EE-002", name: "Michael Chen", specialization: "Control Systems", availability: "Low", activeProjects: 2 },
  { id: "EE-003", name: "Jessica Williams", specialization: "Lighting & Energy Efficiency", availability: "Medium", activeProjects: 1 },
  { id: "EE-004", name: "David Lee", specialization: "Automation & PLC", availability: "Medium", activeProjects: 2 },
  { id: "EE-005", name: "Alex Rodriguez", specialization: "Electrical Safety Systems", availability: "High", activeProjects: 0 },
];

// Mock data for equipment
const equipment = [
  { id: "EQ-001", name: "Fluke 289 Multimeter", status: "Available", lastCalibration: "2025-01-10", nextCalibration: "2025-07-10" },
  { id: "EQ-002", name: "Thermal Imaging Camera", status: "In Use", lastCalibration: "2024-12-15", nextCalibration: "2025-06-15" },
  { id: "EQ-003", name: "Power Quality Analyzer", status: "Available", lastCalibration: "2025-02-05", nextCalibration: "2025-08-05" },
  { id: "EQ-004", name: "Cable Tester", status: "Maintenance", lastCalibration: "2024-11-20", nextCalibration: "2025-05-20" },
  { id: "EQ-005", name: "Portable Generator", status: "Available", lastCalibration: "2025-01-30", nextCalibration: "2025-07-30" },
];

export default function ElectricalEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
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
                            <DropdownMenuItem>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
                              Manage Team
                            </DropdownMenuItem>
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
    </div>
  );
}