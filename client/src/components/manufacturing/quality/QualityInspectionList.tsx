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
import {
  fabInspectionTemplates,
  productionQCTemplates,
  finalQCTemplates,
  executiveReviewTemplates,
  pdiTemplates,
} from "@/templates/qualityTemplates";

interface QualityInspectionListProps {
  inspections: QualityInspection[];
  type: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
}

export default function QualityInspectionList({ inspections, type }: QualityInspectionListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  // Filter templates based on inspection type
  const getTemplatesForType = () => {
    switch (type) {
      case 'final-qc':
        return finalQCTemplates;
      case 'in-process':
        return [...fabInspectionTemplates, ...productionQCTemplates].filter(t => t.inspectionType === 'in-process');
      case 'executive-review':
        return executiveReviewTemplates;
      case 'pdi':
        return pdiTemplates;
      default:
        return [];
    }
  };

  const createInspectionMutation = useMutation({
    mutationFn: async (data: Partial<QualityInspection>) => {
      const response = await fetch('/api/manufacturing/quality/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, templateType: type })
      });
      if (!response.ok) throw new Error('Failed to create inspection');
      return response.json();
    },
    onSuccess: (newInspection) => {
      queryClient.setQueryData<QualityInspection[]>(
        ['/api/manufacturing/quality/inspections'],
        (old = []) => [...old, newInspection]
      );
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
      const response = await fetch(`/api/manufacturing/quality/inspections/${inspection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspection)
      });
      if (!response.ok) throw new Error('Failed to update inspection');
      return response.json();
    },
    onSuccess: (updatedInspection) => {
      queryClient.setQueryData<QualityInspection[]>(
        ['/api/manufacturing/quality/inspections'],
        (old = []) => old.map(item => item.id === updatedInspection.id ? updatedInspection : item)
      );
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

  const handleStatusUpdate = (id: string, newStatus: QualityInspection['status']) => {
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
    queryKey: ['/api/manufacturing/quality/templates'],
  });

  const { data: ncrs = [] } = useQuery<NonConformanceReport[]>({
    queryKey: ['/api/manufacturing/quality/ncrs'],
  });

  const getStatusColor = (status: QualityInspection['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {type === 'final-qc' ? 'Final Quality Control' :
             type === 'in-process' ? 'In-Process Inspection' :
             type === 'executive-review' ? 'Executive Review' :
             'Pre-Delivery Inspection'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage {type.replace('-', ' ')} inspections and quality checks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FontAwesomeIcon icon="file-alt" className="mr-2 h-4 w-4" />
            View Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Production Line</TableHead>
                <TableHead>Defects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow
                  key={inspection.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleInspectionClick(inspection)}
                >
                  <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                  <TableCell className="font-medium capitalize">
                    {inspection.templateType}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inspection.inspector}</TableCell>
                  <TableCell>{inspection.productionLineId}</TableCell>
                  <TableCell>
                    {inspection.results.defectsFound.length > 0 && (
                      <Badge variant="destructive">
                        {inspection.results.defectsFound.length} Issues Found
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
                        <DropdownMenuItem onClick={() => handleInspectionClick(inspection)}>
                          <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedInspection(inspection);
                          setShowDetailsDialog(true);
                        }}>
                          <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {inspection.results.defectsFound.length > 0 && (
                          <DropdownMenuItem onClick={() => handleCreateNCR(inspection)}>
                            <FontAwesomeIcon icon="exclamation-triangle" className="mr-2 h-4 w-4" />
                            Create NCR
                          </DropdownMenuItem>
                        )}
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

      {showCreateDialog && (
        <CreateInspectionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={createInspectionMutation.mutate}
          type={type}
          templates={getTemplatesForType()}
        />
      )}

      {showTemplateDialog && (
        <InspectionTemplateDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
          type={type}
          templates={getTemplatesForType()}
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