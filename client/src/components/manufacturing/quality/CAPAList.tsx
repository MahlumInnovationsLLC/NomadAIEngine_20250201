import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEllipsisVertical,
  faEye,
  faEdit,
  faPlus,
  faFileImport,
  faLink
} from '@fortawesome/pro-light-svg-icons';
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CAPA } from "@/types/manufacturing/capa";
import { MilestoneTimeline } from "./MilestoneTimeline";
import { getCapaMilestones } from "./utils/milestoneUtils";

const fetchCAPAs = async (): Promise<CAPA[]> => {
  // Mocked data, replace with actual API call
  return [
    {
      id: "capa-001",
      number: "CAPA-2025-001",
      title: "Incorrect Part Dimension",
      description: "Dimensions of parts from supplier XYZ are outside of specification",
      status: "open",
      priority: "high",
      department: "Manufacturing",
      area: "Machine Shop",
      type: "corrective",
      rootCause: "Supplier calibration issue",
      verificationMethod: "Measurement of next 3 batches",
      scheduledReviewDate: "2025-04-15",
      sourceNcrId: "NCR-2025-005",
      createdAt: "2025-03-01T08:30:00Z",
      updatedAt: "2025-03-02T10:15:00Z",
      actions: [
        {
          id: "action-001",
          type: "corrective",
          description: "Notify supplier of calibration requirements",
          status: "completed",
          dueDate: "2025-03-10T00:00:00Z",
          assignedTo: "John Smith",
          completedDate: "2025-03-08T00:00:00Z"
        },
        {
          id: "action-002",
          type: "preventive",
          description: "Implement receiving inspection for all parts from this supplier",
          status: "in_progress",
          dueDate: "2025-03-25T00:00:00Z",
          assignedTo: "Lisa Johnson"
        }
      ]
    },
    {
      id: "capa-002",
      number: "CAPA-2025-002",
      title: "Process Control Failure",
      description: "Temperature control failure in heat treatment process",
      status: "in_progress",
      priority: "critical",
      department: "Production",
      area: "Heat Treatment",
      type: "corrective",
      rootCause: "Faulty thermocouple",
      verificationMethod: "Process validation run",
      scheduledReviewDate: "2025-04-10",
      sourceNcrId: "NCR-2025-008",
      createdAt: "2025-03-05T09:15:00Z",
      updatedAt: "2025-03-08T11:30:00Z",
      actions: [
        {
          id: "action-003",
          type: "corrective",
          description: "Replace all thermocouples in heat treatment furnace",
          status: "completed",
          dueDate: "2025-03-15T00:00:00Z",
          assignedTo: "Mark Williams",
          completedDate: "2025-03-12T00:00:00Z"
        },
        {
          id: "action-004",
          type: "preventive",
          description: "Implement daily calibration checks of heat treatment equipment",
          status: "open",
          dueDate: "2025-03-20T00:00:00Z",
          assignedTo: "Sarah Davis"
        }
      ]
    },
    {
      id: "capa-003",
      number: "CAPA-2025-003",
      title: "Documentation Error",
      description: "Work instructions missing critical steps",
      status: "verification",
      priority: "medium",
      department: "Quality",
      area: "Documentation",
      type: "preventive",
      rootCause: "Incomplete document review process",
      verificationMethod: "Documentation audit",
      scheduledReviewDate: "2025-03-30",
      sourceNcrId: "NCR-2025-012",
      createdAt: "2025-03-10T14:00:00Z",
      updatedAt: "2025-03-20T16:45:00Z",
      actions: [
        {
          id: "action-005",
          type: "corrective",
          description: "Update work instructions for assembly process",
          status: "completed",
          dueDate: "2025-03-18T00:00:00Z",
          assignedTo: "Jennifer Brown",
          completedDate: "2025-03-17T00:00:00Z"
        },
        {
          id: "action-006",
          type: "preventive",
          description: "Implement document control software",
          status: "completed",
          dueDate: "2025-03-25T00:00:00Z",
          assignedTo: "Robert Wilson",
          completedDate: "2025-03-22T00:00:00Z"
        }
      ]
    }
  ];
};

export default function CAPAList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data: capas = [], isLoading, error, refetch } = useQuery<CAPA[]>({
    queryKey: ['/api/manufacturing/quality/capas'],
    queryFn: fetchCAPAs,
    staleTime: 5000,
    retry: 2
  });

  const handleFileImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Import feature not implemented",
      description: "This feature is coming soon"
    });
  };

  const getPriorityBadgeVariant = (priority: CAPA['priority']) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: CAPA['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'verification':
        return 'warning';
      case 'closed':
        return 'outline';
      case 'draft':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const groupedCAPAs = capas.reduce((acc, capa) => {
    const status = capa.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(capa);
    return acc;
  }, {} as Record<string, CAPA[]>);

  const CAPATable = ({ capas }: { capas: CAPA[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>CAPA #</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Source NCR</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {capas.map((capa) => {
          const { milestones, currentMilestoneId } = getCapaMilestones(capa);
          
          return (
            <React.Fragment key={capa.id}>
              <TableRow 
                className="cursor-pointer hover:bg-muted/50 border-b-0"
                onClick={() => setSelectedCAPA(capa)}
              >
                <TableCell className="font-medium">{capa.number}</TableCell>
                <TableCell>{capa.title}</TableCell>
                <TableCell>{capa.department}</TableCell>
                <TableCell>{formatDate(capa.createdAt)}</TableCell>
                <TableCell className="capitalize">{capa.type}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(capa.status)}>
                    {capa.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(capa.priority)}>
                    {capa.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {capa.sourceNcrId ? (
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      <FontAwesomeIcon icon={faLink} className="mr-1 h-3 w-3" />
                      {capa.sourceNcrId}
                    </Button>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedCAPA(capa)}>
                        <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCAPA(capa);
                      }}>
                        <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              {/* Timeline Row */}
              <TableRow className="hover:bg-transparent border-b cursor-pointer" onClick={() => setSelectedCAPA(capa)}>
                <TableCell colSpan={9} className="py-2">
                  <div className="px-4">
                    <MilestoneTimeline 
                      milestones={milestones} 
                      currentMilestoneId={currentMilestoneId}
                      compact={true}
                    />
                  </div>
                </TableCell>
              </TableRow>
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading CAPAs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-lg border border-destructive/50 p-4 max-w-lg mx-auto">
          <h3 className="font-semibold text-destructive mb-2">Error Loading CAPAs</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Corrective and Preventive Actions</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage actions to address root causes and prevent recurrence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <FontAwesomeIcon icon={faFileImport} className="mr-2 h-4 w-4" />
            Import CAPAs
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
            New CAPA
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All CAPAs</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All CAPAs</CardTitle>
            </CardHeader>
            <CardContent>
              <CAPATable capas={capas} />
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(groupedCAPAs).map(([status, statusCapas]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>{status.replace('_', ' ').toUpperCase()} CAPAs</CardTitle>
              </CardHeader>
              <CardContent>
                <CAPATable capas={statusCapas} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CAPAs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV or Excel file containing CAPA data. The file should include the following columns:
                title, description, type, priority, department, area, rootCause
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileImport} disabled={!importFile}>
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CAPA Creation/Edit Dialog would go here */}
      
      {/* CAPA Details Dialog would go here */}
    </div>
  );
}