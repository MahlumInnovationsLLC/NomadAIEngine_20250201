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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PartRequestForm from "./PartRequestForm";

interface WeldingJob {
  id: string;
  name: string;
  material: string;
  thickness: number;
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
  jointType?: string;
  weldType?: string;
}

interface WeldingStation {
  id: string;
  name: string;
  type: 'mig' | 'tig' | 'spot' | 'arc';
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: WeldingJob;
  operator?: string;
  materialUsage: {
    wire: number;
    gas: number;
  };
  nextMaintenance: Date;
  location?: string;
  model?: string;
  capabilities?: string[];
  energyConsumption?: number;
  maintenanceHistory?: {
    date: Date;
    type: string;
    technician: string;
    notes: string;
  }[];
}

interface WeldingOperator {
  id: string;
  name: string;
  certification: string[];
  skill: 'apprentice' | 'journeyman' | 'expert';
  specialties: string[];
  availability: boolean;
  currentStation?: string;
  completedJobs: number;
  qualityAverage: number;
}

interface WeldingConsumable {
  id: string;
  name: string;
  type: 'wire' | 'gas' | 'rod' | 'flux';
  material: string;
  stock: number;
  unit: string;
  reorderPoint: number;
  location: string;
  lastDelivery: Date;
}

export default function WeldingManagement() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("stations");

  const { data: stations = [] } = useQuery<WeldingStation[]>({
    queryKey: ['/api/fabrication/welding/stations'],
  });

  const { data: jobs = [] } = useQuery<WeldingJob[]>({
    queryKey: ['/api/fabrication/welding/jobs', selectedStation],
    enabled: !!selectedStation || activeTab === "jobs",
  });

  const { data: operators = [] } = useQuery<WeldingOperator[]>({
    queryKey: ['/api/fabrication/welding/operators'],
    enabled: activeTab === "operators",
  });

  const { data: consumables = [] } = useQuery<WeldingConsumable[]>({
    queryKey: ['/api/fabrication/welding/consumables'],
    enabled: activeTab === "inventory",
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

  const getQualityScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getInventoryStatusColor = (stock: number, reorderPoint: number) => {
    const percentage = (stock / reorderPoint) * 100;
    if (percentage > 200) return "text-green-500";  // Well-stocked
    if (percentage > 100) return "text-lime-500";   // Adequately stocked
    if (percentage > 50) return "text-yellow-500";  // Getting low
    return "text-red-500";  // Critical
  };

  const selectedStationDetails = selectedStation 
    ? stations.find(station => station.id === selectedStation) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Welding Operations</h2>
        <div className="flex gap-2">
          <PartRequestForm fabricationType="welding" buttonText="Request Part" />
          <Button variant="outline">
            <FontAwesomeIcon icon="user" className="mr-2 h-4 w-4" />
            Assign Operator
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="inventory">Consumables</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {stations.map((station) => (
              <Card 
                key={station.id}
                className={`cursor-pointer transition-colors ${
                  selectedStation === station.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedStation(station.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {station.name} ({station.type.toUpperCase()})
                  </CardTitle>
                  <Badge
                    variant={station.status === 'running' ? 'default' : 'secondary'}
                  >
                    {station.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {station.currentJob ? (
                      <>
                        <p className="text-sm font-medium">{station.currentJob.name}</p>
                        <Progress value={station.currentJob.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress: {station.currentJob.progress}%</span>
                          <span>ETA: {station.currentJob.estimatedTime} min</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No active job</p>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground pt-2">
                      <span>Operator: {station.operator || 'Unassigned'}</span>
                      <span>
                        Wire: {station.materialUsage.wire}m | Gas: {station.materialUsage.gas}L
                      </span>
                    </div>
                    {station.location && (
                      <div className="text-xs text-muted-foreground">
                        Location: {station.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedStation && selectedStationDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Station Details: {selectedStationDetails.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Specifications</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm">{selectedStationDetails.type.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Model:</span>
                        <span className="text-sm">{selectedStationDetails.model || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className="text-sm">{selectedStationDetails.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm">{selectedStationDetails.location || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-sm text-muted-foreground">Energy Consumption:</span>
                        <span className="text-sm">{selectedStationDetails.energyConsumption || "N/A"} kW</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold mt-4 mb-2">Material Usage</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Wire Consumption:</span>
                        <Progress value={selectedStationDetails.materialUsage.wire / 5} className="h-2 flex-1" />
                        <span className="text-sm">{selectedStationDetails.materialUsage.wire}m</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Gas Consumption:</span>
                        <Progress value={selectedStationDetails.materialUsage.gas / 2} className="h-2 flex-1" />
                        <span className="text-sm">{selectedStationDetails.materialUsage.gas}L</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Capabilities</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedStationDetails.capabilities?.map((capability, index) => (
                        <Badge key={index} variant="outline">{capability}</Badge>
                      )) || "No capabilities listed"}
                    </div>
                    
                    <h3 className="font-semibold mt-4 mb-2">Operator</h3>
                    {selectedStationDetails.operator ? (
                      <div className="space-y-1">
                        <div className="text-sm">{selectedStationDetails.operator}</div>
                        <div className="text-xs text-muted-foreground">
                          {operators.find(op => op.name === selectedStationDetails.operator)?.certification.join(", ")}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No operator assigned</div>
                    )}
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm">
                        <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                        Assign Operator
                      </Button>
                    </div>
                  </div>
                </div>
                
                {selectedStationDetails.maintenanceHistory && selectedStationDetails.maintenanceHistory.length > 0 && (
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
                        {selectedStationDetails.maintenanceHistory.slice(0, 3).map((record, index) => (
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
              <Select defaultValue="priority">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                  <SelectItem value="due-date">Sort by Due Date</SelectItem>
                  <SelectItem value="material">Sort by Material</SelectItem>
                  <SelectItem value="status">Sort by Status</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Weld Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>{job.material}</TableCell>
                      <TableCell>{job.thickness}mm</TableCell>
                      <TableCell>{job.weldType || 'Standard'}</TableCell>
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
                      <TableCell>
                        <span className={getQualityScoreColor(job.qualityScore)}>
                          {job.qualityScore ? `${job.qualityScore}%` : 'N/A'}
                        </span>
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
        
        <TabsContent value="operators" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-operators">Search:</Label>
              <Input id="search-operators" placeholder="Search operators..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button>
                <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                Add Operator
              </Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="graduation-cap" className="mr-2 h-4 w-4" />
                Certification Management
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {operators.map((operator) => (
              <Card key={operator.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">{operator.name}</CardTitle>
                    <Badge variant={operator.availability ? "default" : "secondary"}>
                      {operator.availability ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Skill Level:</span>
                      <span className="text-sm font-medium capitalize">{operator.skill}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Certifications:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {operator.certification.map((cert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Specialties:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {operator.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <span className="text-sm">Completed Jobs: {operator.completedJobs}</span>
                      <span className={`text-sm ${getQualityScoreColor(operator.qualityAverage)}`}>
                        Avg. Quality: {operator.qualityAverage}%
                      </span>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <FontAwesomeIcon icon="clipboard-list" className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search-consumables">Search:</Label>
              <Input id="search-consumables" placeholder="Search consumables..." className="w-[300px]" />
            </div>
            <div className="flex gap-2">
              <Button>
                <FontAwesomeIcon icon="cart-plus" className="mr-2 h-4 w-4" />
                Order Consumables
              </Button>
              <Button variant="outline">
                <FontAwesomeIcon icon="dolly" className="mr-2 h-4 w-4" />
                Receive Delivery
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Consumables Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{consumables.length}</div>
                    <div className="text-xs text-muted-foreground">Total Item Types</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-muted rounded-md">
                      <div className="text-lg font-bold">
                        {consumables.filter(c => c.stock <= c.reorderPoint).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Low Stock Items</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <div className="text-lg font-bold">
                        {consumables.filter(c => c.stock === 0).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Out of Stock</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
                    Print Inventory Report
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Consumables Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Delivery</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumables.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell className={getInventoryStatusColor(item.stock, item.reorderPoint)}>
                          {item.stock} {item.unit}
                        </TableCell>
                        <TableCell>{item.reorderPoint} {item.unit}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{new Date(item.lastDelivery).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="plus" className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="minus" className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="shopping-cart" className="h-4 w-4" />
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
        
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-green-500">92.7%</div>
                  <div className="text-sm text-muted-foreground mt-2">Last 30 days</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Target</span>
                    <span>95%</span>
                  </div>
                  <Progress value={92.7 / 95 * 100} className="h-2" />
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-2 rounded-md">
                      <div className="text-xs text-muted-foreground">Defect Rate</div>
                      <div className="text-lg font-bold">1.8%</div>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <div className="text-xs text-muted-foreground">Rework Rate</div>
                      <div className="text-lg font-bold">2.3%</div>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <div className="text-xs text-muted-foreground">First Pass Yield</div>
                      <div className="text-lg font-bold">95.9%</div>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <div className="text-xs text-muted-foreground">Scrap Rate</div>
                      <div className="text-lg font-bold">0.7%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Common Defects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Porosity</span>
                      <span>32%</span>
                    </div>
                    <Progress value={32} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Undercut</span>
                      <span>24%</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Incomplete Fusion</span>
                      <span>18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cracks</span>
                      <span>14%</span>
                    </div>
                    <Progress value={14} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Other</span>
                      <span>12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Quality Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Defects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell>A-Frame Assembly</TableCell>
                    <TableCell>Michael Chen</TableCell>
                    <TableCell className="text-green-500">97%</TableCell>
                    <TableCell>Minor undercut</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50">Passed</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{new Date(Date.now() - 86400000).toLocaleDateString()}</TableCell>
                    <TableCell>Support Bracket</TableCell>
                    <TableCell>Sarah Johnson</TableCell>
                    <TableCell className="text-red-500">74%</TableCell>
                    <TableCell>Porosity, inconsistent bead</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50">Failed</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{new Date(Date.now() - 172800000).toLocaleDateString()}</TableCell>
                    <TableCell>Pressure Vessel</TableCell>
                    <TableCell>Michael Chen</TableCell>
                    <TableCell className="text-green-500">94%</TableCell>
                    <TableCell>Minor spatter</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50">Passed</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
