import { useState, useEffect } from "react";
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
  DialogFooter,
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
import { useForm } from 'react-hook-form';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProductionProject,
  BillOfMaterialsWithTraceability,
  BOMComponentWithTraceability,
  Material,
  MaterialBatch,
  MRPCalculation,
  BOMRevision
} from "@/types/manufacturing";
import QrScanner from 'react-qr-scanner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { WorkloadCenterPanel } from './WorkloadCenterPanel';

interface BOMManagementProps {}

export function BOMManagement({}: BOMManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("components");
  const [selectedComponent, setSelectedComponent] = useState<BOMComponentWithTraceability | undefined>(undefined);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [showRevisionApproval, setShowRevisionApproval] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<MaterialBatch | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<BOMRevision | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerPurpose, setScannerPurpose] = useState<'add' | 'replace' | null>(null);
  const [scannedComponent, setScannedComponent] = useState<string | null>(null);
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);

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

  const approveRevisionMutation = useMutation({
    mutationFn: async ({ componentId, revisionId }: { componentId: string, revisionId: string }) => {
      const response = await fetch(`/api/manufacturing/bom/component/${componentId}/revision/${revisionId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve revision');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manufacturing/bom/${selectedProject}`] });
      toast({ title: "Success", description: "Revision approved successfully" });
    },
  });

  const addQualityCheckMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/manufacturing/quality-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add quality check');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/material-batches', selectedProject] });
      toast({ title: "Success", description: "Quality check recorded successfully" });
    },
  });

  const recordPartChangeMutation = useMutation({
    mutationFn: async (data: {
      projectId: string;
      componentId: string;
      changeType: 'add' | 'replace';
      scannedCode: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/manufacturing/part-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to record part change');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manufacturing/bom/${selectedProject}`] });
      toast({ title: "Success", description: "Part change recorded successfully" });
      setShowScanner(false);
      setShowReplacementDialog(false);
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

  function AddComponentDialog({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) {
    const form = useForm<BOMComponentWithTraceability>({
      defaultValues: {
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
        leadTime: 0,
        critical: false,
        traceabilityRequired: false,
        wastageAllowance: 0,
        revisionHistory: [],
        materialId: '',
        qualityRequirements: []
      },
    });

    const onSubmit = async (data: BOMComponentWithTraceability) => {
      try {
        await addComponentMutation.mutateAsync(data);
      } catch (error) {
        console.error('Failed to add component:', error);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Component</DialogTitle>
            <DialogDescription>
              Add a new component to the bill of materials with traceability and quality requirements.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    onValueChange={(value) => form.setValue('materialId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Quantity"
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Unit Cost"
                    {...form.register('unitCost', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Lead Time (days)"
                    {...form.register('leadTime', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch('critical')}
                    onCheckedChange={(checked) => form.setValue('critical', !!checked)}
                  />
                  <label>Critical Component</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch('traceabilityRequired')}
                    onCheckedChange={(checked) => form.setValue('traceabilityRequired', !!checked)}
                  />
                  <label>Require Traceability</label>
                </div>
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Wastage Allowance (%)"
                  {...form.register('wastageAllowance', { valueAsNumber: true })}
                />
              </div>
              {/* Quality Requirements */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quality Requirements</p>
                <div>
                  <Input placeholder="Specification" {...form.register('qualityRequirements')} />
                  <Input placeholder="Acceptance Criteria" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Add Component
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  function VersionHistoryDialog({
    open,
    onOpenChange,
    component,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    component?: BOMComponentWithTraceability;
  }) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View the revision history for this component.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {component?.revisionHistory.map((revision, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium">
                        Revision {revision.revisionNumber}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(revision.effectiveDate).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      revision.approvalStatus === 'approved' ? 'bg-green-500/10 text-green-500' :
                      revision.approvalStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }>
                      {revision.approvalStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Changes</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {revision.changes.map((change, i) => (
                          <li key={i}>{change}</li>
                        ))}
                      </ul>
                    </div>
                    {revision.notes && (
                      <div>
                        <p className="text-sm font-medium">Notes</p>
                        <p className="text-sm text-muted-foreground">{revision.notes}</p>
                      </div>
                    )}
                    {revision.approvedBy && (
                      <div>
                        <p className="text-sm font-medium">Approved By</p>
                        <p className="text-sm text-muted-foreground">
                          {revision.approvedBy} on {new Date(revision.approvalDate!).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  function QualityCheckDialog({
    open,
    onOpenChange,
    batch,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batch: MaterialBatch | null;
  }) {
    const form = useForm({
      defaultValues: {
        inspectionNotes: '',
        measurements: {},
        status: 'pending_inspection' as const,
      },
    });

    const onSubmit = async (data: any) => {
      if (!batch) return;
      try {
        await addQualityCheckMutation.mutateAsync({
          batchId: batch.id,
          ...data,
          inspectionDate: new Date().toISOString(),
        });
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to add quality check:', error);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Quality Inspection</DialogTitle>
            <DialogDescription>
              Record quality inspection results for batch {batch?.batchNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Add quality check form fields */}
              <div>
                <Select
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="quarantined">Quarantined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Textarea
                  placeholder="Inspection Notes"
                  {...form.register('inspectionNotes')}
                />
              </div>
              {/* Add measurement fields based on material requirements */}
            </div>
            <DialogFooter>
              <Button type="submit">Save Inspection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  function ScannerDialog({
    open,
    onOpenChange,
    purpose,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purpose: 'add' | 'replace';
  }) {
    const handleScan = (result: any) => {
      if (result) {
        setScannedComponent(result);
        setShowScanner(false);
        if (purpose === 'replace') {
          setShowReplacementDialog(true);
        } else {
          recordPartChangeMutation.mutate({
            projectId: selectedProject!,
            componentId: result,
            changeType: 'add',
            scannedCode: result,
          });
        }
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Scan Component {purpose === 'add' ? 'to Add' : 'to Replace'}</DialogTitle>
            <DialogDescription>
              Scan the QR code or barcode on the component
            </DialogDescription>
          </DialogHeader>
          <div className="h-[300px]">
            <QrScanner
              onScan={handleScan}
              onError={(error: Error) => console.error(error)}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  function ReplacementConfirmationDialog({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) {
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
      if (!scannedComponent || !selectedProject) return;

      recordPartChangeMutation.mutate({
        projectId: selectedProject,
        componentId: scannedComponent,
        changeType: 'replace',
        scannedCode: scannedComponent,
        notes,
      });
    };

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Component Replacement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to replace this component?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Textarea
              placeholder="Enter replacement notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Replacement
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

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
            onClick={() => {
              setScannerPurpose('add');
              setShowScanner(true);
            }}
          >
            <FontAwesomeIcon icon="qrcode" className="mr-2" />
            Scan to Add
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setScannerPurpose('replace');
              setShowScanner(true);
            }}
          >
            <FontAwesomeIcon icon="exchange-alt" className="mr-2" />
            Scan to Replace
          </Button>
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
            <TabsTrigger value="quality-monitoring">
              <FontAwesomeIcon icon="chart-line" className="mr-2" />
              Quality Monitoring
            </TabsTrigger>
            <TabsTrigger value="workload-centers">
              <FontAwesomeIcon icon="industry" className="mr-2" />
              Workload Centers
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
                    <TableRow key={component.materialId} onClick={() => {setSelectedComponent(component); setShowVersionHistory(true)}}>
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
                        <Button variant="ghost" size="icon" onClick={() => {setSelectedComponent(component); setShowVersionHistory(true)}}>
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

          <TabsContent value="quality-monitoring" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gridcols-3 gap-4">
                    <div className="text-center">                    <h3 className="text-2xl font-bold">
                      {batches.filter(b => b.qualityStatus === 'approved').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Approved Batches</p>
                  </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold">
                        {batches.filter(b => b.qualityStatus === 'rejected').length}
                      </h3>
                      <p className="text-sm text-muted-foreground">Rejected Batches</p>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold">
                        {batches.filter(b => b.qualityStatus === 'quarantined').length}
                      </h3>
                      <p className="text-sm text-muted-foreground">Quarantined Batches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Quality Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batches
                      .filter(b => b.qualityStatus === 'rejected' || b.qualityStatus === 'quarantined')
                      .map(batch => (
                        <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Batch #{batch.batchNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {batch.qualityStatus}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowQualityCheck(true);
                            }}
                          >
                            Inspect
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="workload-centers">
            <WorkloadCenterPanel projectId={selectedProject!} />
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
      {showAddComponent && (
        <AddComponentDialog
          open={showAddComponent}
          onOpenChange={setShowAddComponent}
        />
      )}

      {showVersionHistory && (
        <VersionHistoryDialog
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          component={selectedComponent}
        />
      )}
      {showQualityCheck && (
        <QualityCheckDialog
          open={showQualityCheck}
          onOpenChange={setShowQualityCheck}
          batch={selectedBatch}
        />
      )}
      {showScanner && (
        <ScannerDialog
          open={showScanner}
          onOpenChange={setShowScanner}
          purpose={scannerPurpose!}
        />
      )}
      {showReplacementDialog && (
        <ReplacementConfirmationDialog
          open={showReplacementDialog}
          onOpenChange={setShowReplacementDialog}
        />
      )}
    </Card>
  );
}