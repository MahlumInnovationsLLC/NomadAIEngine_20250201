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
import ITAARPanel from "./aar/ITAARPanel";

// Mock data - would be replaced with actual data from API
const activeProjects = [
  { 
    id: "ITP-001", 
    name: "Manufacturing Execution System Integration", 
    progress: 65, 
    priority: "High", 
    leadEngineer: "Alex Johnson",
    startDate: "2025-02-10",
    endDate: "2025-05-15",
    status: "On Track"
  },
  { 
    id: "ITP-002", 
    name: "IoT Sensor Network Deployment", 
    progress: 40, 
    priority: "High", 
    leadEngineer: "Samantha Lee",
    startDate: "2025-03-01",
    endDate: "2025-06-30",
    status: "At Risk"
  },
  { 
    id: "ITP-003", 
    name: "Data Analytics Platform Expansion", 
    progress: 80, 
    priority: "Medium", 
    leadEngineer: "Marcus Chen",
    startDate: "2025-01-15",
    endDate: "2025-04-20",
    status: "On Track"
  },
  { 
    id: "ITP-004", 
    name: "Network Infrastructure Upgrade", 
    progress: 30, 
    priority: "Medium", 
    leadEngineer: "Rachel Kim",
    startDate: "2025-03-10",
    endDate: "2025-07-01",
    status: "On Track"
  },
];

const engineers = [
  { id: "IT-001", name: "Alex Johnson", specialization: "Systems Integration", availability: "Low", activeProjects: 3 },
  { id: "IT-002", name: "Samantha Lee", specialization: "IoT & Embedded Systems", availability: "Medium", activeProjects: 2 },
  { id: "IT-003", name: "Marcus Chen", specialization: "Data Engineering", availability: "Low", activeProjects: 4 },
  { id: "IT-004", name: "Rachel Kim", specialization: "Network Architecture", availability: "High", activeProjects: 1 },
  { id: "IT-005", name: "Daniel Garcia", specialization: "Cybersecurity", availability: "Medium", activeProjects: 2 },
];

export default function ITEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");

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
    </div>
  );
}