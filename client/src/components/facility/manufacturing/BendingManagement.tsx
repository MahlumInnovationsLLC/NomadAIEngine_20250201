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

interface BendingJob {
  id: string;
  name: string;
  material: string;
  thickness: number;
  angle: number;
  length: number;
  status: 'queued' | 'in-progress' | 'completed' | 'qa-check';
  progress: number;
  operator?: string;
  startTime?: Date;
  estimatedTime: number;
  priority: number;
  qualityScore?: number;
  partNumber?: string;
  requestedBy?: string;
  projectId?: string;
  bendType?: 'air' | 'coining' | 'bottom' | 'rotary';
  numberOfBends?: number;
  width?: number;
  radius?: number;
}

interface BendingMachine {
  id: string;
  name: string;
  type: 'press-brake' | 'folding' | 'roll-bending';
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: BendingJob;
  tooling: {
    type: string;
    wear: number;
    lastReplacement: Date;
  };
  operator?: string;
  nextMaintenance: Date;
  maxForce: number;
  maxLength: number;
  model?: string;
  manufacturer?: string;
  location?: string;
  precision?: number;
  yearManufactured?: number;
  maintenanceHistory?: {
    date: Date;
    type: string;
    technician: string;
    notes: string;
  }[];
}

interface BendingTool {
  id: string;
  name: string;
  type: 'punch' | 'die' | 'adapter';
  length: number;
  angle?: number;
  radius?: number;
  wear: number;
  compatibility: string[];
  location: string;
  lastUsed?: Date;
}

interface BendingSetup {
  id: string;
  name: string;
  machine: string;
  punch: string;
  die: string;
  gap: number;
  material: string;
  thickness: number;
  angle: number;
  backgauge: number;
  force: number;
  springback: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
}

export default function BendingManagement() {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("machines");

  const { data: machines = [] } = useQuery<BendingMachine[]>({
    queryKey: ['/api/fabrication/bending/machines'],
  });

  const { data: jobs = [] } = useQuery<BendingJob[]>({
    queryKey: ['/api/fabrication/bending/jobs', selectedMachine],
    enabled: !!selectedMachine || activeTab === "jobs",
  });

  const { data: tools = [] } = useQuery<BendingTool[]>({
    queryKey: ['/api/fabrication/bending/tools'],
    enabled: activeTab === "tooling",
  });

  const { data: setups = [] } = useQuery<BendingSetup[]>({
    queryKey: ['/api/fabrication/bending/setups'],
    enabled: activeTab === "setups",
  });

  const getWearColor = (wear: number) => {
    if (wear < 30) return "text-green-500";
    if (wear < 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority > 7) return "Urgent";
    if (priority > 4) return "High";
    return "Normal";
  };

  const getPriorityVariant = (priority: number) => {
    if (priority > 7) return "destructive";
    if (priority > 4) return "default";
    return "secondary";
  };

  const formatMachineType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const selectedMachineDetails = selectedMachine 
    ? machines.find(machine => machine.id === selectedMachine) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bending Operations</h2>
        <div className="flex gap-2">
          <PartRequestForm fabricationType="bending" buttonText="Request Part" />
          <Button variant="outline">
            <FontAwesomeIcon icon="tools" className="mr-2 h-4 w-4" />
            Tool Setup
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
          <TabsTrigger value="tooling">Tooling</TabsTrigger>
          <TabsTrigger value="setups">Setups</TabsTrigger>
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
                    {machine.name} ({formatMachineType(machine.type)})
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
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Tool Wear</p>
                        <p className={`text-sm font-medium ${getWearColor(machine.tooling.wear)}`}>
                          {machine.tooling.wear}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Max Force</p>
                        <p className="text-sm font-medium">{machine.maxForce} tons</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Max Length</p>
                        <p className="text-sm font-medium">{machine.maxLength}mm</p>
                      </div>
                    </div>
                    {machine.operator && (
                      <div className="text-xs text-muted-foreground pt-2">
                        Operator: {machine.operator}
                      </div>
                    )}
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
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm">{formatMachineType(selectedMachineDetails.type)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Model:</span>
                        <span className="text-sm">{selectedMachineDetails.model || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Manufacturer:</span>
                        <span className="text-sm">{selectedMachineDetails.manufacturer || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Max Force:</span>
                        <span className="text-sm">{selectedMachineDetails.maxForce} tons</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Max Length:</span>
                        <span className="text-sm">{selectedMachineDetails.maxLength} mm</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Precision:</span>
                        <span className="text-sm">±{selectedMachineDetails.precision || "0.1"} mm</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Year:</span>
                        <span className="text-sm">{selectedMachineDetails.yearManufactured || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Current Status</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className="text-sm">{selectedMachineDetails.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Operator:</span>
                        <span className="text-sm">{selectedMachineDetails.operator || "Unassigned"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Next Maintenance:</span>
                        <span className="text-sm">{new Date(selectedMachineDetails.nextMaintenance).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Current Tooling:</span>
                        <span className="text-sm">{selectedMachineDetails.tooling.type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Tool Wear:</span>
                        <span className={`text-sm ${getWearColor(selectedMachineDetails.tooling.wear)}`}>
                          {selectedMachineDetails.tooling.wear}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Last Tool Change:</span>
                        <span className="text-sm">{new Date(selectedMachineDetails.tooling.lastReplacement).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="mr-2">
                        <FontAwesomeIcon icon="exchange-alt" className="mr-2 h-4 w-4" />
                        Change Tooling
                      </Button>
                      <Button variant="outline" size="sm">
                        <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                        Assign Operator
                      </Button>
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
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Angle</TableHead>
                    <TableHead>Bend Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>{job.material} ({job.thickness}mm)</TableCell>
                      <TableCell>{job.length}mm {job.width && `× ${job.width}mm`}</TableCell>
                      <TableCell>{job.angle}° {job.radius && `(R${job.radius})`}</TableCell>
                      <TableCell>{job.bendType || "Standard"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(job.priority)}>
                          {getPriorityLabel(job.priority)}
                        </Badge>
                      </TableCell>
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
        
        <TabsContent value="tooling" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-tools">Search:</Label>
              <Input id="search-tools" placeholder="Search tools..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button>
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                New Tool
              </Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
                Print Inventory
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tool Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Button variant="outline" className="w-full justify-start">
                    <FontAwesomeIcon icon="hammer" className="mr-2 h-4 w-4" />
                    Punches ({tools.filter(t => t.type === 'punch').length})
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FontAwesomeIcon icon="grip-horizontal" className="mr-2 h-4 w-4" />
                    Dies ({tools.filter(t => t.type === 'die').length})
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FontAwesomeIcon icon="wrench" className="mr-2 h-4 w-4" />
                    Adapters ({tools.filter(t => t.type === 'adapter').length})
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FontAwesomeIcon icon="tools" className="mr-2 h-4 w-4" />
                    Custom Tools ({tools.filter(t => t.type !== 'punch' && t.type !== 'die' && t.type !== 'adapter').length})
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tool Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Length</TableHead>
                      <TableHead>Angle/Radius</TableHead>
                      <TableHead>Wear</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell className="font-medium">{tool.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tool.type}</Badge>
                        </TableCell>
                        <TableCell>{tool.length}mm</TableCell>
                        <TableCell>
                          {tool.angle ? `${tool.angle}°` : tool.radius ? `R${tool.radius}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={tool.wear} className="h-2 w-16" />
                            <span className={getWearColor(tool.wear)}>
                              {tool.wear}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{tool.location}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="sync" className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="setups" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-setups">Search:</Label>
              <Input id="search-setups" placeholder="Search setups..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button>
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Create Setup
              </Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="history" className="mr-2 h-4 w-4" />
                Setup History
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setup Name</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Tooling</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Angle</TableHead>
                    <TableHead>Force</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setups.map((setup) => (
                    <TableRow key={setup.id}>
                      <TableCell className="font-medium">{setup.name}</TableCell>
                      <TableCell>{setup.machine}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>Punch: {setup.punch}</div>
                          <div>Die: {setup.die}</div>
                          <div>Gap: {setup.gap}mm</div>
                        </div>
                      </TableCell>
                      <TableCell>{setup.material} ({setup.thickness}mm)</TableCell>
                      <TableCell>{setup.angle}°</TableCell>
                      <TableCell>{setup.force} tons</TableCell>
                      <TableCell>{setup.createdBy}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="play" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="copy" className="h-4 w-4" />
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
                  Tool Wear Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Tool wear chart will be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Job Completion Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Job completion chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Average Setup Time</div>
                    <div className="text-2xl font-bold">18.3 min</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>2.1 min from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Cycle Time</div>
                    <div className="text-2xl font-bold">4.6 min/part</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>0.8 min from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Precision Rate</div>
                    <div className="text-2xl font-bold">98.7%</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-up" className="h-3 w-3 text-green-500 mr-1" />
                      <span>0.4% from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Scrap Rate</div>
                    <div className="text-2xl font-bold">1.2%</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>0.3% from last month</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px] flex items-center justify-center text-muted-foreground border rounded-md p-4">
                  Monthly performance trends chart will be displayed here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
