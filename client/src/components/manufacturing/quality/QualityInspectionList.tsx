import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { QualityInspection, QualityFormTemplate, Project } from "@/types/manufacturing";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";

import { CreateInspectionDialog } from "./dialogs/CreateInspectionDialog";
import { InspectionDetailsDialog } from "./dialogs/InspectionDetailsDialog";
import { NCRDialog } from "./dialogs/NCRDialog";
import { InspectionTemplateDialog } from "./dialogs/InspectionTemplateDialog";
import { ImportInspectionsDialog } from "./dialogs/ImportInspectionsDialog";

interface QualityInspectionListProps {
  inspections?: QualityInspection[];
  type: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
  projects?: Project[];
}

export default function QualityInspectionList({ inspections = [], type, projects = [] }: QualityInspectionListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Filter inspections by type
  const filteredInspections = inspections.filter(inspection => inspection.type === type);

  const createInspectionMutation = useMutation({
    mutationFn: async (data: Partial<QualityInspection>) => {
      if (!socket) throw new Error('Socket connection not available');
      return new Promise((resolve, reject) => {
        socket.emit('quality:inspection:create', { ...data, templateType: type }, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      });
    },
    onSuccess: (newInspection) => {
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

  const handleInspectionClick = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowDetailsDialog(true);
  };

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
      <div className="flex justify-between items-center mb-4">
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
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => {
            setSelectedTemplate(null);
            setShowCreateDialog(true);
          }}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project Number</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Production Line</TableHead>
                <TableHead>Defects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.map((inspection) => (
                <TableRow
                  key={inspection.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleInspectionClick(inspection)}
                >
                  <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                  <TableCell>
                    {inspection.projectId ? (
                      <span className="font-medium">{inspection.projectNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">No Project</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {inspection.partNumber ? (
                      <span className="font-medium">{inspection.partNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium capitalize">
                    {inspection.type}
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
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleInspectionClick(inspection);
                        }}>
                          <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {inspection.results.defectsFound.length > 0 && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInspection(inspection);
                            setShowNCRDialog(true);
                          }}>
                            <FontAwesomeIcon icon="triangle-exclamation" className="mr-2 h-4 w-4" />
                            Create NCR
                          </DropdownMenuItem>
                        )}
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
          projects={projects}
          template={selectedTemplate}
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
          onUpdate={(updated) => {
            if (socket) {
              socket.emit('quality:inspection:update', {
                id: updated.id,
                updates: updated
              });
            }
          }}
        />
      )}
      {showImportDialog && (
        <ImportInspectionsDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          type={type}
          onSuccess={() => {
            if (socket) {
              socket.emit('quality:inspection:list');
            }
          }}
        />
      )}
    </div>
  );
}