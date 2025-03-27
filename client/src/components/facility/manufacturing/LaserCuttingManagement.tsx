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

interface LaserJob {
  id: string;
  name: string;
  material: string;
  thickness: number;
  status: 'queued' | 'in-progress' | 'completed' | 'qa-check';
  progress: number;
  powerSettings: {
    power: number;
    speed: number;
    frequency: number;
  };
  startTime?: Date;
  estimatedTime: number;
  priority: number;
  qualityScore?: number;
  partNumber?: string;
  projectId?: string;
  requestedBy?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  fileFormat?: string;
}

interface LaserMachine {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: LaserJob;
  powerLevel: number;
  gasLevel: number;
  lensCondition: number;
  nextMaintenance: Date;
  model?: string;
  maxWorkArea?: {
    width: number;
    height: number;
  };
  maxPower?: number;
  location?: string;
  maintenanceHistory?: {
    date: Date;
    type: string;
    technician: string;
    notes: string;
  }[];
  energyConsumption?: number;
  supportedMaterials?: string[];
}

interface MaterialLibrary {
  id: string;
  material: string;
  thickness: number;
  settings: {
    power: number;
    speed: number;
    frequency: number;
    passes: number;
    assistGas: string;
    notes?: string;
  };
  lastUpdated: Date;
  testResults?: {
    kerf: number;
    edgeQuality: number;
    heatAffectedZone: number;
  };
}

interface LaserMetrics {
  utilization: number;
  uptime: number;
  energyEfficiency: number;
  materialWaste: number;
  avgCycleTime: number;
  qualityScore: number;
  maintenanceDowntime: number;
}

export default function LaserCuttingManagement() {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("machines");

  const { data: machines = [] } = useQuery<LaserMachine[]>({
    queryKey: ['/api/fabrication/laser/machines'],
  });

  const { data: jobs = [] } = useQuery<LaserJob[]>({
    queryKey: ['/api/fabrication/laser/jobs', selectedMachine],
    enabled: !!selectedMachine || activeTab === "jobs",
  });

  const { data: materials = [] } = useQuery<MaterialLibrary[]>({
    queryKey: ['/api/fabrication/laser/materials'],
    enabled: activeTab === "materials",
  });

  const { data: metrics } = useQuery<LaserMetrics>({
    queryKey: ['/api/fabrication/laser/metrics'],
    enabled: activeTab === "analytics",
  });

  const getConsumableStatusColor = (level: number) => {
    if (level > 70) return "text-green-500";
    if (level > 30) return "text-yellow-500";
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

  const selectedMachineDetails = selectedMachine 
    ? machines.find(machine => machine.id === selectedMachine) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Laser Cutting Operations</h2>
        <div className="flex gap-2">
          <PartRequestForm fabricationType="laser" buttonText="Request Part" />
          <Button variant="outline">
            <FontAwesomeIcon icon="wrench" className="mr-2 h-4 w-4" />
            Maintenance
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
          <TabsTrigger value="materials">Material Library</TabsTrigger>
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
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Power</p>
                        <p className={`text-sm font-medium ${getConsumableStatusColor(machine.powerLevel)}`}>
                          {machine.powerLevel}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Gas</p>
                        <p className={`text-sm font-medium ${getConsumableStatusColor(machine.gasLevel)}`}>
                          {machine.gasLevel}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Lens</p>
                        <p className={`text-sm font-medium ${getConsumableStatusColor(machine.lensCondition)}`}>
                          {machine.lensCondition}%
                        </p>
                      </div>
                    </div>
                    {machine.location && (
                      <div className="text-xs text-muted-foreground pt-2">
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
                        <span className="text-sm text-muted-foreground">Max Power:</span>
                        <span className="text-sm">{selectedMachineDetails.maxPower || "N/A"} W</span>
                      </div>
                      {selectedMachineDetails.maxWorkArea && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-sm text-muted-foreground">Work Area:</span>
                          <span className="text-sm">
                            {selectedMachineDetails.maxWorkArea.width} x {selectedMachineDetails.maxWorkArea.height} mm
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Energy Usage:</span>
                        <span className="text-sm">{selectedMachineDetails.energyConsumption || "N/A"} kW</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Consumables Status</h3>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Power Supply:</span>
                          <span className={getConsumableStatusColor(selectedMachineDetails.powerLevel)}>
                            {selectedMachineDetails.powerLevel}%
                          </span>
                        </div>
                        <Progress 
                          value={selectedMachineDetails.powerLevel}
                          className={`h-2 ${
                            selectedMachineDetails.powerLevel > 70 ? "bg-green-600" :
                            selectedMachineDetails.powerLevel > 30 ? "bg-yellow-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Assist Gas:</span>
                          <span className={getConsumableStatusColor(selectedMachineDetails.gasLevel)}>
                            {selectedMachineDetails.gasLevel}%
                          </span>
                        </div>
                        <Progress 
                          value={selectedMachineDetails.gasLevel}
                          className={`h-2 ${
                            selectedMachineDetails.gasLevel > 70 ? "bg-green-600" :
                            selectedMachineDetails.gasLevel > 30 ? "bg-yellow-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Lens Condition:</span>
                          <span className={getConsumableStatusColor(selectedMachineDetails.lensCondition)}>
                            {selectedMachineDetails.lensCondition}%
                          </span>
                        </div>
                        <Progress 
                          value={selectedMachineDetails.lensCondition}
                          className={`h-2 ${
                            selectedMachineDetails.lensCondition > 70 ? "bg-green-600" :
                            selectedMachineDetails.lensCondition > 30 ? "bg-yellow-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                    </div>
                    
                    <h3 className="font-semibold mt-4 mb-2">Supported Materials</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedMachineDetails.supportedMaterials?.map((material, index) => (
                        <Badge key={index} variant="outline">{material}</Badge>
                      )) || "No materials listed"}
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
                
                <div className="mt-4 flex justify-end space-x-2">
                  <Button size="sm" variant="outline">View Full History</Button>
                  <Button size="sm">Schedule Maintenance</Button>
                </div>
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
              <Button variant="outline" size="sm">
                <FontAwesomeIcon icon="file-import" className="mr-2 h-3 w-3" />
                Import
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
                    <TableHead>Thickness</TableHead>
                    <TableHead>Power Settings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>{job.material}</TableCell>
                      <TableCell>{job.thickness}mm</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>Power: {job.powerSettings.power}W</div>
                          <div>Speed: {job.powerSettings.speed}mm/s</div>
                          <div>Freq: {job.powerSettings.frequency}Hz</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(job.priority)}>
                          {getPriorityLabel(job.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.requestedBy || "N/A"}</TableCell>
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
                            <FontAwesomeIcon icon="eye" className="h-4 w-4" />
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
        
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-materials">Search:</Label>
              <Input id="search-materials" placeholder="Search material library..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button>
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Add Material
              </Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="flask" className="mr-2 h-4 w-4" />
                Test Mode
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Thickness</TableHead>
                    <TableHead>Power</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Passes</TableHead>
                    <TableHead>Assist Gas</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.material}</TableCell>
                      <TableCell>{material.thickness}mm</TableCell>
                      <TableCell>{material.settings.power}W</TableCell>
                      <TableCell>{material.settings.speed}mm/s</TableCell>
                      <TableCell>{material.settings.frequency}Hz</TableCell>
                      <TableCell>{material.settings.passes}</TableCell>
                      <TableCell>{material.settings.assistGas}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="copy" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="chart-line" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {materials.length > 0 && materials[0].testResults && (
            <Card>
              <CardHeader>
                <CardTitle>Material Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 border rounded-md p-4">
                    <h3 className="font-semibold">Edge Quality Assessment</h3>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Edge quality chart will be displayed here
                    </div>
                  </div>
                  <div className="space-y-2 border rounded-md p-4">
                    <h3 className="font-semibold">Cut Speed vs. Thickness</h3>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Speed vs. thickness chart will be displayed here
                    </div>
                  </div>
                  <div className="space-y-2 border rounded-md p-4">
                    <h3 className="font-semibold">Power Consumption Analysis</h3>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Power consumption chart will be displayed here
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                <div className="text-center py-6">
                  <div className="text-3xl font-bold">{metrics?.utilization || 0}%</div>
                  <div className="text-sm text-muted-foreground mt-2">Last 30 days</div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm">Uptime</div>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics?.uptime || 0} className="h-2 flex-1" />
                      <span className="text-sm">{metrics?.uptime || 0}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm">Energy Efficiency</div>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics?.energyEfficiency || 0} className="h-2 flex-1" />
                      <span className="text-sm">{metrics?.energyEfficiency || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Material Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Material efficiency chart will be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground">First Pass Yield</div>
                    <div className="text-2xl font-bold">94.7%</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground">Scrap Rate</div>
                    <div className="text-2xl font-bold">2.1%</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground">Edge Quality</div>
                    <div className="text-2xl font-bold">96.3%</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground">Dimensional Accuracy</div>
                    <div className="text-2xl font-bold">98.9%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Average Cycle Time</div>
                    <div className="text-2xl font-bold">{metrics?.avgCycleTime || 0} min</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>5.2% from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Material Waste</div>
                    <div className="text-2xl font-bold">{metrics?.materialWaste || 0}%</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>3.1% from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Quality Score</div>
                    <div className="text-2xl font-bold">{metrics?.qualityScore || 0}/10</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-up" className="h-3 w-3 text-green-500 mr-1" />
                      <span>0.5 from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Maintenance Downtime</div>
                    <div className="text-2xl font-bold">{metrics?.maintenanceDowntime || 0} hrs</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <FontAwesomeIcon icon="arrow-down" className="h-3 w-3 text-green-500 mr-1" />
                      <span>2.3 hrs from last month</span>
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
