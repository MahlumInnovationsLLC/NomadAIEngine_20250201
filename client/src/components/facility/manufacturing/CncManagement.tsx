import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PartRequestForm from "./PartRequestForm";

interface CncJob {
  id: string;
  name: string;
  material: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: number;
  estimatedTime: number;
  startTime?: Date;
  program: string;
  priority: number;
  partNumber?: string;
  requestedBy?: string;
  projectId?: string;
}

interface CncMachine {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: CncJob;
  toolLife: Record<string, number>;
  nextMaintenance: Date;
  model?: string;
  capabilities?: string[];
  location?: string;
  maxWorkpieceSize?: {
    x: number;
    y: number;
    z: number;
  };
  powerConsumption?: number;
  maintenanceHistory?: {
    date: Date;
    type: string;
    technician: string;
    notes: string;
  }[];
}

interface CncTool {
  id: string;
  name: string;
  type: string;
  diameter: number;
  length: number;
  material: string;
  lifeRemaining: number;
  lastReplaced: Date;
  usageCount: number;
}

export default function CncManagement() {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("machines");

  const { data: machines = [] } = useQuery<CncMachine[]>({
    queryKey: ['/api/fabrication/cnc/machines'],
  });

  const { data: jobs = [] } = useQuery<CncJob[]>({
    queryKey: ['/api/fabrication/cnc/jobs', selectedMachine],
    enabled: !!selectedMachine || activeTab === "jobs",
  });

  const { data: tools = [] } = useQuery<CncTool[]>({
    queryKey: ['/api/fabrication/cnc/tools', selectedMachine],
    enabled: !!selectedMachine && activeTab === "tools",
  });

  const getStatusColor = (status: string) => {
    const colors = {
      idle: "bg-gray-500",
      running: "bg-green-500",
      maintenance: "bg-yellow-500",
      error: "bg-red-500"
    };
    return colors[status as keyof typeof colors];
  };

  const getToolLifeColor = (lifePercentage: number) => {
    if (lifePercentage > 70) return "text-green-500";
    if (lifePercentage > 30) return "text-yellow-500";
    return "text-red-500";
  };

  const selectedMachineDetails = selectedMachine 
    ? machines.find(machine => machine.id === selectedMachine) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">CNC Operations</h2>
        <div className="flex gap-2">
          <PartRequestForm fabricationType="cnc" buttonText="Request Part" />
          <Button variant="outline">
            <FontAwesomeIcon icon="tools" className="mr-2 h-4 w-4" />
            Tool Setup
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
          <TabsTrigger value="tools">Tool Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="machines" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {machines.map((machine) => (
              <Card 
                key={machine.id}
                className={`cursor-pointer transition-colors ${
                  selectedMachine === machine.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedMachine(machine.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {machine.name} {machine.model && `(${machine.model})`}
                  </CardTitle>
                  <Badge
                    variant={machine.status === 'running' ? 'default' : 'secondary'}
                  >
                    {machine.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {machine.currentJob ? (
                      <>
                        <p className="text-sm font-medium">{machine.currentJob.name}</p>
                        <Progress value={machine.currentJob.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress: {machine.currentJob.progress}%</span>
                          <span>ETA: {machine.currentJob.estimatedTime} min</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No active job</p>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground pt-2">
                      <span>Next Maintenance: {new Date(machine.nextMaintenance).toLocaleDateString()}</span>
                      <span>
                        Tool Life: {Object.entries(machine.toolLife)[0]?.[0]}: {Object.entries(machine.toolLife)[0]?.[1]}%
                      </span>
                    </div>
                    {machine.location && (
                      <div className="text-xs text-muted-foreground">
                        Location: {machine.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedMachine && selectedMachineDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Machine Details: {selectedMachineDetails.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Specifications</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Model:</span>
                        <span className="text-sm">{selectedMachineDetails.model || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className="text-sm">{selectedMachineDetails.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm">{selectedMachineDetails.location || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Power Consumption:</span>
                        <span className="text-sm">{selectedMachineDetails.powerConsumption || "N/A"} kW</span>
                      </div>
                      {selectedMachineDetails.maxWorkpieceSize && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">Max Workpiece Size:</span>
                          <span className="text-sm">
                            {selectedMachineDetails.maxWorkpieceSize.x} x {selectedMachineDetails.maxWorkpieceSize.y} x {selectedMachineDetails.maxWorkpieceSize.z} mm
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Capabilities</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedMachineDetails.capabilities?.map((capability, index) => (
                        <Badge key={index} variant="outline">{capability}</Badge>
                      )) || "No capabilities listed"}
                    </div>
                    
                    <h3 className="font-semibold mt-4 mb-2">Tool Life</h3>
                    <div className="space-y-1">
                      {Object.entries(selectedMachineDetails.toolLife).map(([tool, life], index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm">{tool}:</span>
                          <Progress value={life} className="h-2 flex-1" />
                          <span className={`text-sm ${getToolLifeColor(life)}`}>{life}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedMachineDetails.maintenanceHistory && selectedMachineDetails.maintenanceHistory.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Recent Maintenance</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Technician</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMachineDetails.maintenanceHistory.slice(0, 3).map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.type}</TableCell>
                            <TableCell>{record.technician}</TableCell>
                            <TableCell>{record.notes}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-jobs">Search:</Label>
              <Input id="search-jobs" placeholder="Search jobs..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FontAwesomeIcon icon="filter" className="mr-2 h-3 w-3" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <FontAwesomeIcon icon="sort" className="mr-2 h-3 w-3" />
                Sort
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Est. Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>{job.material}</TableCell>
                      <TableCell>{job.program}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={job.priority > 7 ? "destructive" : job.priority > 4 ? "default" : "secondary"}
                        >
                          {job.priority > 7 ? "Urgent" : job.priority > 4 ? "High" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.requestedBy || "N/A"}</TableCell>
                      <TableCell>{job.estimatedTime} min</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="play" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="pause" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="check" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-tools">Search:</Label>
              <Input id="search-tools" placeholder="Search tools..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button>
                <FontAwesomeIcon icon="shopping-cart" className="mr-2 h-4 w-4" />
                Order Tools
              </Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
                Print Inventory
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Diameter</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Life Remaining</TableHead>
                    <TableHead>Last Replaced</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>{tool.type}</TableCell>
                      <TableCell>{tool.diameter} mm</TableCell>
                      <TableCell>{tool.length} mm</TableCell>
                      <TableCell>{tool.material}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={tool.lifeRemaining} className="h-2 w-24" />
                          <span className={getToolLifeColor(tool.lifeRemaining)}>
                            {tool.lifeRemaining}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(tool.lastReplaced).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="sync" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="history" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Machine Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Machine utilization chart will be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Job Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Job completion rate chart will be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Tool Wear Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Tool wear analysis chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Average Setup Time</div>
                    <div className="text-2xl font-bold">12.5 min</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>8.3% from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Average Cycle Time</div>
                    <div className="text-2xl font-bold">5.2 min</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-up" className="h-3 w-3 text-red-500 mr-1" />
                      <span>2.1% from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Machine Downtime</div>
                    <div className="text-2xl font-bold">4.3%</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>1.2% from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">First-Time Quality</div>
                    <div className="text-2xl font-bold">97.8%</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-up" className="h-3 w-3 text-green-500 mr-1" />
                      <span>0.5% from last month</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px] flex items-center justify-center text-muted-foreground border rounded-md p-4">
                  Monthly efficiency trends chart will be displayed here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
