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

// Software development projects data
const activeProjects = [
  { 
    id: "NTC-001", 
    name: "Manufacturing Control System v2.0", 
    progress: 65, 
    priority: "Critical", 
    leadEngineer: "Alex Chen",
    startDate: "2025-01-10",
    endDate: "2025-06-30",
    status: "On Track",
    techStack: "React, TypeScript, Node.js"
  },
  { 
    id: "NTC-002", 
    name: "Predictive Maintenance ML Pipeline", 
    progress: 40, 
    priority: "High", 
    leadEngineer: "Sarah Johnson",
    startDate: "2025-02-15",
    endDate: "2025-08-20",
    status: "On Track",
    techStack: "Python, TensorFlow, AWS"
  },
  { 
    id: "NTC-003", 
    name: "IoT Sensor Integration Platform", 
    progress: 30, 
    priority: "Medium", 
    leadEngineer: "David Garcia",
    startDate: "2025-03-01",
    endDate: "2025-07-15",
    status: "At Risk",
    techStack: "C++, MQTT, Azure IoT"
  },
  { 
    id: "NTC-004", 
    name: "Equipment Monitoring Dashboard", 
    progress: 75, 
    priority: "Medium", 
    leadEngineer: "Maya Patel",
    startDate: "2024-12-05",
    endDate: "2025-05-30",
    status: "On Track",
    techStack: "React, D3.js, Express"
  },
  { 
    id: "NTC-005", 
    name: "Automated Test Framework", 
    progress: 55, 
    priority: "High", 
    leadEngineer: "Jake Wilson",
    startDate: "2025-01-20",
    endDate: "2025-04-30",
    status: "On Track",
    techStack: "Python, Selenium, Jenkins"
  },
];

// Software engineers and developers
const engineers = [
  { id: "NTC-SE-001", name: "Alex Chen", specialization: "Full-Stack Development", availability: "Low", activeProjects: 3, skills: ["React", "Node.js", "TypeScript"] },
  { id: "NTC-SE-002", name: "Sarah Johnson", specialization: "Machine Learning", availability: "Medium", activeProjects: 2, skills: ["Python", "TensorFlow", "Data Science"] },
  { id: "NTC-SE-003", name: "David Garcia", specialization: "IoT & Embedded Systems", availability: "Low", activeProjects: 2, skills: ["C++", "Embedded Linux", "MQTT"] },
  { id: "NTC-SE-004", name: "Maya Patel", specialization: "Frontend Development", availability: "Medium", activeProjects: 1, skills: ["React", "D3.js", "UI/UX"] },
  { id: "NTC-SE-005", name: "Jake Wilson", specialization: "DevOps & QA", availability: "High", activeProjects: 1, skills: ["CI/CD", "Test Automation", "Docker"] },
  { id: "NTC-SE-006", name: "Emma Rodriguez", specialization: "Backend Development", availability: "Medium", activeProjects: 2, skills: ["Java", "Spring Boot", "Microservices"] },
];

export default function NTCEngineeringPanel() {
  const [currentTab, setCurrentTab] = useState("projects");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Software Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects.length}</div>
            <p className="text-sm text-muted-foreground">Across various tech stacks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Code Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">92%</div>
              <Progress value={92} className="h-2 flex-1" />
            </div>
            <p className="text-sm text-muted-foreground">Based on CI metrics</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">
            <FontAwesomeIcon icon="code" className="mr-2 h-4 w-4" />
            Software Projects
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
            Development Team
          </TabsTrigger>
          <TabsTrigger value="planning">
            <FontAwesomeIcon icon="sitemap" className="mr-2 h-4 w-4" />
            Architecture
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
                <CardTitle>Software Development Projects</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  New Software Project
                </Button>
              </div>
              <CardDescription>
                View and manage active software development projects and repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Lead Developer</TableHead>
                    <TableHead>Tech Stack</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Priority</TableHead>
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
                        <span className="text-xs text-muted-foreground">{project.techStack}</span>
                      </TableCell>
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="code-branch" className="h-4 w-4" />
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
                <CardTitle>Development Team</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                  Add Developer
                </Button>
              </div>
              <CardDescription>
                View and manage software developers and engineers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Skills</TableHead>
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
                        <div className="flex flex-wrap gap-1">
                          {engineer.skills?.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
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
                          <FontAwesomeIcon icon="code" className="h-4 w-4" />
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
                <CardTitle>System Architecture</CardTitle>
                <Button size="sm">
                  <FontAwesomeIcon icon="diagram-project" className="mr-2 h-4 w-4" />
                  Create New Diagram
                </Button>
              </div>
              <CardDescription>
                Plan software architecture, system components, and technical roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Code Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">API Integration Review</p>
                            <p className="text-sm text-muted-foreground">April 12, 2025 - 1:00 PM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                        <Separator />
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Performance Optimization</p>
                            <p className="text-sm text-muted-foreground">April 19, 2025 - 10:30 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                        <Separator />
                        <li className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Security Audit</p>
                            <p className="text-sm text-muted-foreground">April 25, 2025 - 9:00 AM</p>
                          </div>
                          <Button variant="outline" size="sm">Details</Button>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Technology Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Frontend (React, TypeScript)</span>
                            <span>35%</span>
                          </div>
                          <Progress value={35} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Backend (Node.js, Express)</span>
                            <span>30%</span>
                          </div>
                          <Progress value={30} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Data Processing (Python, TensorFlow)</span>
                            <span>20%</span>
                          </div>
                          <Progress value={20} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>DevOps (CI/CD, Docker)</span>
                            <span>10%</span>
                          </div>
                          <Progress value={10} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Embedded Systems (C++, IoT)</span>
                            <span>5%</span>
                          </div>
                          <Progress value={5} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Technical Documentation</Button>
                    </CardFooter>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Development Lifecycle</CardTitle>
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
                          <h4 className="font-semibold">System Design</h4>
                          <p className="text-sm text-muted-foreground">Architecture and component planning</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">3</span>
                          </div>
                          <h4 className="font-semibold">Implementation</h4>
                          <p className="text-sm text-muted-foreground">Coding, unit tests, and integration</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">4</span>
                          </div>
                          <h4 className="font-semibold">Testing & QA</h4>
                          <p className="text-sm text-muted-foreground">Validation and quality assurance</p>
                        </li>
                        <li className="ml-9 relative pl-6">
                          <div className="absolute w-6 h-6 rounded-full bg-muted flex items-center justify-center -left-10 top-1">
                            <span className="text-xs font-bold">5</span>
                          </div>
                          <h4 className="font-semibold">Deployment & Maintenance</h4>
                          <p className="text-sm text-muted-foreground">Production rollout and ongoing support</p>
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