import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualityInspection, QualityFormTemplate, NonConformanceReport } from "@/types/manufacturing";
import { useToast } from "@/hooks/use-toast";

import { CreateInspectionDialog } from "./dialogs/CreateInspectionDialog";
import { InspectionTemplateDialog } from "./dialogs/InspectionTemplateDialog";
import { NCRDialog } from "./dialogs/NCRDialog";
import { InspectionDetailsDialog } from "./dialogs/InspectionDetailsDialog";

export default function QualityInspectionList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inspections");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  // Initialize the cache with empty array if not already set
  if (!queryClient.getQueryData(["/api/manufacturing/quality/inspections"])) {
    queryClient.setQueryData(["/api/manufacturing/quality/inspections"], []);
  }

  // Get inspections from cache
  const inspections = queryClient.getQueryData<QualityInspection[]>(["/api/manufacturing/quality/inspections"]) || [];

  const createInspectionMutation = useMutation({
    mutationFn: async (data: Partial<QualityInspection>) => {
      const currentInspections = queryClient.getQueryData<QualityInspection[]>(["/api/manufacturing/quality/inspections"]) || [];
      const newInspection = {
        ...data,
        id: `INSP-${Date.now()}`,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as QualityInspection;

      return [...currentInspections, newInspection];
    },
    onSuccess: (newInspections) => {
      queryClient.setQueryData(["/api/manufacturing/quality/inspections"], newInspections);
      setShowCreateDialog(false);
      toast({
        title: 'Success',
        description: 'New inspection has been created successfully.',
      });
    },
    onError: (error: Error) => {
      console.error('Creation error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateInspectionMutation = useMutation({
    mutationFn: async (inspection: QualityInspection) => {
      const currentInspections = queryClient.getQueryData<QualityInspection[]>(["/api/manufacturing/quality/inspections"]) || [];
      return currentInspections.map(item => 
        item.id === inspection.id ? { ...inspection, updatedAt: new Date().toISOString() } : item
      );
    },
    onSuccess: (updatedInspections) => {
      queryClient.setQueryData(["/api/manufacturing/quality/inspections"], updatedInspections);
      toast({
        title: 'Success',
        description: 'Inspection has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = (id: string, newStatus: string) => {
    const inspection = inspections.find(i => i.id === id);
    if (inspection) {
      const updatedInspection = { ...inspection, status: newStatus };
      updateInspectionMutation.mutate(updatedInspection);
    }
  };

  const handleInspectionClick = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowDetailsDialog(true);
  };

  const handleCreateNCR = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowNCRDialog(true);
  };

  const { data: templates = [] } = useQuery<QualityFormTemplate[]>({
    queryKey: ["/api/manufacturing/quality/templates"],
  });

  const { data: ncrs = [] } = useQuery<NonConformanceReport[]>({
    queryKey: ["/api/manufacturing/quality/ncrs"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'in-progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Quality Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage inspections, templates, and non-conformance reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FontAwesomeIcon icon="file-alt" className="mr-2 h-4 w-4" />
            Manage Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="ncrs">NCRs</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Production Line</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => (
                    <TableRow key={inspection.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleInspectionClick(inspection)}>
                      <TableCell className="font-medium capitalize">
                        {inspection.type.replace('-', ' ')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={`${getStatusColor(inspection.status)} text-white`}>
                              {inspection.status}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inspection.id, 'pending')}>
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inspection.id, 'in-progress')}>
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inspection.id, 'completed')}>
                              Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(inspection.id, 'failed')}>
                              Failed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{inspection.assignedTo}</TableCell>
                      <TableCell>{formatDate(inspection.dueDate)}</TableCell>
                      <TableCell>{inspection.productionLine}</TableCell>
                      <TableCell>
                        {inspection.defects && inspection.defects.length > 0 && (
                          <Badge variant="destructive">
                            {inspection.defects.length} Issues Found
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateNCR(inspection)}>
                              <FontAwesomeIcon icon="exclamation-triangle" className="mr-2 h-4 w-4" />
                              Create NCR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="file-pdf" className="mr-2 h-4 w-4" />
                              Export Report
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

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Form Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="capitalize">{template.type}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>{template.createdBy}</TableCell>
                      <TableCell>{formatDate(template.updatedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="copy" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="trash" className="h-4 w-4" />
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

        <TabsContent value="ncrs">
          <Card>
            <CardHeader>
              <CardTitle>Non-Conformance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NCR Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ncrs.map((ncr) => (
                    <TableRow key={ncr.id}>
                      <TableCell className="font-medium">{ncr.number}</TableCell>
                      <TableCell>{ncr.title}</TableCell>
                      <TableCell className="capitalize">{ncr.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ncr.severity === 'critical'
                              ? 'destructive'
                              : ncr.severity === 'major'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {ncr.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ncr.status === 'open'
                              ? 'default'
                              : ncr.status === 'closed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {ncr.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(ncr.detectedDate)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="cog" className="mr-2 h-4 w-4" />
                              Create CAPA
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <FontAwesomeIcon icon="file-pdf" className="mr-2 h-4 w-4" />
                              Export Report
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
      </Tabs>

      {showCreateDialog && (
        <CreateInspectionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={createInspectionMutation.mutate}
        />
      )}

      {showTemplateDialog && (
        <InspectionTemplateDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
        />
      )}

      {showNCRDialog && selectedInspection && (
        <NCRDialog
          open={showNCRDialog}
          onOpenChange={setShowNCRDialog}
          inspection={selectedInspection}
        />
      )}
      {showDetailsDialog && selectedInspection && (
        <InspectionDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          inspection={selectedInspection}
          onUpdate={updateInspectionMutation.mutate}
        />
      )}
    </div>
  );
}