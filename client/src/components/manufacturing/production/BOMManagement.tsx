import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { 
  ProductionProject, 
  BillOfMaterialsWithTraceability,
  BOMComponentWithTraceability,
  Material,
  MaterialBatch,
  MRPCalculation 
} from "@/types/manufacturing";

interface BOMManagementProps {}

export function BOMManagement({}: BOMManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("components");

  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useQuery<ProductionProject[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: () => fetch('/api/manufacturing/projects').then(res => res.json()),
  });

  const { data: bom, isLoading: isLoadingBOM } = useQuery<BillOfMaterialsWithTraceability>({
    queryKey: [`/api/manufacturing/bom/${selectedProject}`],
    enabled: !!selectedProject,
    queryFn: () => fetch(`/api/manufacturing/bom/${selectedProject}`).then(res => res.json()),
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/material/inventory'],
    queryFn: () => fetch('/api/material/inventory').then(res => res.json()),
  });

  const { data: batches = [] } = useQuery<MaterialBatch[]>({
    queryKey: ['/api/manufacturing/material-batches', selectedProject],
    enabled: !!selectedProject,
    queryFn: () => fetch(`/api/manufacturing/material-batches/${selectedProject}`).then(res => res.json()),
  });

  const { data: mrpData = [] } = useQuery<MRPCalculation[]>({
    queryKey: ['/api/manufacturing/mrp', selectedProject],
    enabled: !!selectedProject,
    queryFn: () => fetch(`/api/manufacturing/mrp/${selectedProject}`).then(res => res.json()),
  });

  const addComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/manufacturing/bom/${selectedProject}/component`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add component');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manufacturing/bom/${selectedProject}`] });
      toast({ title: "Success", description: "Component added successfully" });
      setShowAddComponent(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoadingProjects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            Loading available projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projectsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Failed to load projects. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedProject) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a project to manage its Bill of Materials
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              onValueChange={(value) => setSelectedProject(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectNumber} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingBOM) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading BOM Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            Loading bill of materials...
          </div>
        </CardContent>
      </Card>
    );
  }

  const project = projects.find(p => p.id === selectedProject);

  const getTotalCost = (components: BOMComponentWithTraceability[]) => {
    return components.reduce((acc, component) => acc + component.totalCost, 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Bill of Materials</CardTitle>
          <p className="text-sm text-muted-foreground">
            Project: {project?.projectNumber} - {project?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowVersionHistory(true)}
          >
            <FontAwesomeIcon icon="history" className="mr-2" />
            Version History
          </Button>
          <Button onClick={() => setShowAddComponent(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2" />
            Add Component
          </Button>
          <Button variant="outline" onClick={() => setSelectedProject(null)}>
            <FontAwesomeIcon icon="arrow-left" className="mr-2" />
            Change Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="components">
              <FontAwesomeIcon icon="sitemap" className="mr-2" />
              Components
            </TabsTrigger>
            <TabsTrigger value="material-batches">
              <FontAwesomeIcon icon="boxes-stacked" className="mr-2" />
              Material Batches
            </TabsTrigger>
            <TabsTrigger value="mrp">
              <FontAwesomeIcon icon="calculator" className="mr-2" />
              MRP
            </TabsTrigger>
            <TabsTrigger value="quality">
              <FontAwesomeIcon icon="clipboard-check" className="mr-2" />
              Quality
            </TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium">Version: {bom?.version}</p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(bom?.lastUpdated || '').toLocaleString()}
                </p>
              </div>
              <Badge variant="outline" className={
                bom?.status === 'active' ? 'bg-green-500/10 text-green-500' :
                bom?.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }>
                {bom?.status}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Traceability</TableHead>
                  <TableHead>Quality Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bom?.components.map((component) => {
                  const material = materials.find(m => m.id === component.materialId);
                  const qualityStatus = batches.find(b => b.materialId === component.materialId)?.qualityStatus;
                  return (
                    <TableRow key={component.materialId}>
                      <TableCell>{material?.name || component.materialId}</TableCell>
                      <TableCell>{component.quantity}</TableCell>
                      <TableCell>${component.unitCost.toFixed(2)}</TableCell>
                      <TableCell>${component.totalCost.toFixed(2)}</TableCell>
                      <TableCell>{component.leadTime} days</TableCell>
                      <TableCell>
                        {component.critical ? (
                          <Badge className="bg-red-500">Critical</Badge>
                        ) : (
                          <Badge className="bg-gray-500">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {component.traceabilityRequired ? (
                          <Badge className="bg-blue-500">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          qualityStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                          qualityStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          qualityStatus === 'quarantined' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-gray-500/10 text-gray-500'
                        }>
                          {qualityStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="history" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="material-batches" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Quality Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const material = materials.find(m => m.id === batch.materialId);
                  return (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.batchNumber}</TableCell>
                      <TableCell>{material?.name}</TableCell>
                      <TableCell>{batch.quantity} {batch.unit}</TableCell>
                      <TableCell>{batch.remainingQuantity} {batch.unit}</TableCell>
                      <TableCell>{batch.supplier}</TableCell>
                      <TableCell>{new Date(batch.receivedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          batch.qualityStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                          batch.qualityStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          batch.qualityStatus === 'quarantined' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                        }>
                          {batch.qualityStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{batch.location}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="mrp" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Gross Requirement</TableHead>
                  <TableHead>Projected Available</TableHead>
                  <TableHead>Net Requirement</TableHead>
                  <TableHead>Planned Orders</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mrpData.map((calc) => {
                  const material = materials.find(m => m.id === calc.materialId);
                  return (
                    <TableRow key={calc.id}>
                      <TableCell>{material?.name}</TableCell>
                      <TableCell>{new Date(calc.periodEnd).toLocaleDateString()}</TableCell>
                      <TableCell>{calc.grossRequirement}</TableCell>
                      <TableCell>{calc.projectedAvailable}</TableCell>
                      <TableCell>{calc.netRequirement}</TableCell>
                      <TableCell>{calc.plannedOrders}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          calc.netRequirement > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                        }>
                          {calc.netRequirement > 0 ? 'Action Required' : 'Sufficient'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <div className="grid gap-4">
              {bom?.components.map((component) => {
                const material = materials.find(m => m.id === component.materialId);
                const batch = batches.find(b => b.materialId === component.materialId);
                return (
                  <Card key={component.materialId}>
                    <CardHeader>
                      <CardTitle className="text-lg">{material?.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Quality Status</p>
                            <Badge variant="outline" className={
                              batch?.qualityStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                              batch?.qualityStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                              batch?.qualityStatus === 'quarantined' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-blue-500/10 text-blue-500'
                            }>
                              {batch?.qualityStatus || 'pending'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Last Inspection</p>
                            <p className="text-sm text-muted-foreground">
                              {batch?.inspectionDate ? new Date(batch.inspectionDate).toLocaleString() : 'Not inspected'}
                            </p>
                          </div>
                        </div>
                        {component.qualityRequirements && (
                          <div>
                            <p className="text-sm font-medium">Quality Requirements</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {component.qualityRequirements.map((req, index) => (
                                <li key={index}>
                                  {req.specification}: {req.acceptanceCriteria}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total Components: {bom?.components.length || 0}
          </div>
          <div className="text-lg font-semibold">
            Total Cost: ${getTotalCost(bom?.components || []).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}