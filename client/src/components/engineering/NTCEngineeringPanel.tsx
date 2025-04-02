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
import NTCAARPanel from "./aar/NTCAARPanel";

// Mock data - would be replaced with actual data from API
const activeProjects = [
  { 
    id: "NTC-001", 
    name: "Advanced Materials Research", 
    progress: 45, 
    priority: "High", 
    leadEngineer: "Dr. Elizabeth Parker",
    startDate: "2025-01-20",
    endDate: "2025-08-15",
    status: "On Track"
  },
  { 
    id: "NTC-002", 
    name: "Machine Learning for Predictive Maintenance", 
    progress: 70, 
    priority: "High", 
    leadEngineer: "Dr. Jason Wright",
    startDate: "2024-11-15",
    endDate: "2025-06-30",
    status: "On Track"
  },
  { 
    id: "NTC-003", 
    name: "Additive Manufacturing Process Optimization", 
    progress: 30, 
    priority: "Medium", 
    leadEngineer: "Dr. Sophia Martinez",
    startDate: "2025-02-01",
    endDate: "2025-09-15",
    status: "At Risk"
  },
  { 
    id: "NTC-004", 
    name: "Nano-coating Technology Development", 
    progress: 60, 
    priority: "Medium", 
    leadEngineer: "Dr. Benjamin Harris",
    startDate: "2024-12-10",
    endDate: "2025-07-20",
    status: "On Track"
  },
];

const engineers = [
  { id: "NTC-R-001", name: "Dr. Elizabeth Parker", specialization: "Materials Science", availability: "Low", activeProjects: 3 },
  { id: "NTC-R-002", name: "Dr. Jason Wright", specialization: "AI & Machine Learning", availability: "Medium", activeProjects: 2 },
  { id: "NTC-R-003", name: "Dr. Sophia Martinez", specialization: "Additive Manufacturing", availability: "Low", activeProjects: 4 },
  { id: "NTC-R-004", name: "Dr. Benjamin Harris", specialization: "Nanotechnology", availability: "High", activeProjects: 1 },
  { id: "NTC-R-005", name: "Dr. Michelle Taylor", specialization: "Robotics & Automation", availability: "Medium", activeProjects: 2 },
];

export default function NTCEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Research Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects.length}</div>
            <p className="text-sm text-muted-foreground">Across various technologies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Innovation Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">78%</div>
              <Progress value={78} className="h-2 flex-1" />
            </div>
            <p className="text-sm text-muted-foreground">Based on adoption metrics</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Patent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">6</div>
            <p className="text-sm text-muted-foreground">Filed this year</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">
            <FontAwesomeIcon icon="flask" className="mr-2 h-4 w-4" />
            Research Projects
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
                <CardTitle>NTC Research Projects</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  New Research Project
                </Button>
              </div>
              <CardDescription>
                View and manage active research and development projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Lead Researcher</TableHead>
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
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                        </Button>
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
                <CardTitle>Research Team</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                  Add Researcher
                </Button>
              </div>
              <CardDescription>
                View and manage NTC research team members
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
                <CardTitle>Research Planning</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="calendar-plus" className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>
              <CardDescription>
                Plan research activities, resource allocation, and technology roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Research Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Advanced Materials Prototype Review</p>
                            <p className="text-sm text-muted-foreground">April 15, 2025 - 1:00 PM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                        <Separator />
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">ML Algorithm Validation</p>
                            <p className="text-sm text-muted-foreground">April 22, 2025 - 10:30 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                        <Separator />
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Quarterly Innovation Review</p>
                            <p className="text-sm text-muted-foreground">April 30, 2025 - 9:00 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Research Focus Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Advanced Materials</span>
                            <span>35%</span>
                          </div>
                          <Progress value={35} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>AI & Machine Learning</span>
                            <span>25%</span>
                          </div>
                          <Progress value={25} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Additive Manufacturing</span>
                            <span>20%</span>
                          </div>
                          <Progress value={20} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Nanotechnology</span>
                            <span>15%</span>
                          </div>
                          <Progress value={15} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Robotics & Automation</span>
                            <span>5%</span>
                          </div>
                          <Progress value={5} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Strategic Research Plan</Button>
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
                          <h4 className="font-semibold">Research Phase</h4>
                          <p className="text-sm text-muted-foreground">Fundamental research and technology exploration</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center -left-10 top-1">
                            <span className="text-xs text-primary-foreground font-bold">2</span>
                          </div>
                          <h4 className="font-semibold">Laboratory Validation</h4>
                          <p className="text-sm text-muted-foreground">Proof of concept and controlled testing</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">3</span>
                          </div>
                          <h4 className="font-semibold">Prototype Development</h4>
                          <p className="text-sm text-muted-foreground">Creating and refining functional prototypes</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">4</span>
                          </div>
                          <h4 className="font-semibold">Pilot Implementation</h4>
                          <p className="text-sm text-muted-foreground">Limited production environment testing</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">5</span>
                          </div>
                          <h4 className="font-semibold">Technology Transfer</h4>
                          <p className="text-sm text-muted-foreground">Integration into production processes</p>
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
          <NTCAARPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}