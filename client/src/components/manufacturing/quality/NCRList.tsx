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
  faClipboardList
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
import { NCRDialog } from "./dialogs/NCRDialog";
import { NCRDetailsDialog } from "./dialogs/NCRDetailsDialog";
import { NonConformanceReport } from "@/types/manufacturing/ncr";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MilestoneTimeline, MiniMilestoneTimeline } from "./MilestoneTimeline";
import { getNcrMilestones } from "./utils/milestoneUtils";
import { createNCRTimelineItems } from "./utils/timelineItems";

const fetchNCRs = async (): Promise<NonConformanceReport[]> => {
  const response = await fetch('/api/manufacturing/quality/ncrs');
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch NCRs');
    }
    throw new Error(`Failed to fetch NCRs: ${response.statusText}`);
  }
  return response.json();
};

export default function NCRList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NonConformanceReport | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data: ncrs = [], isLoading, error, refetch } = useQuery<NonConformanceReport[]>({
    queryKey: ['/api/manufacturing/quality/ncrs'],
    queryFn: fetchNCRs,
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

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await fetch('/api/manufacturing/quality/ncrs/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();
      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.count} NCRs`
      });

      setShowImportDialog(false);
      setImportFile(null);
      refetch(); // Refresh the NCR list
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import NCRs",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: NonConformanceReport['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'under_review':
        return 'destructive';
      case 'pending_disposition':
        return 'default';
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

  const groupedNCRs = ncrs.reduce((acc, ncr) => {
    const status = ncr.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(ncr);
    return acc;
  }, {} as Record<string, NonConformanceReport[]>);

  const NCRTable = ({ ncrs }: { ncrs: NonConformanceReport[] }) => (
    <div className="overflow-x-auto">
      <Table className="relative">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead>NCR #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Project #</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ncrs.map((ncr) => {
            // Create timeline items using our new function that has document-specific milestone types
            const timelineItems = createNCRTimelineItems(ncr);
            
            return (
              <React.Fragment key={ncr.id}>
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50 border-b-0"
                  onClick={() => setSelectedNCR(ncr)}
                >
                  <TableCell className="font-medium">{ncr.number}</TableCell>
                  <TableCell>{ncr.title}</TableCell>
                  <TableCell>{ncr.projectNumber || 'N/A'}</TableCell>
                  <TableCell>{formatDate(ncr.createdAt)}</TableCell>
                  <TableCell className="capitalize">{ncr.type?.replace('_', ' ') || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(ncr.status)}>
                      {ncr.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ncr.severity === 'critical' ? 'destructive' : 'default'}>
                      {ncr.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{ncr.reportedBy}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedNCR(ncr)}>
                          <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNCR(ncr);
                        }}>
                          <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <FontAwesomeIcon icon={faClipboardList} className="mr-2 h-4 w-4" />
                          Create CAPA
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                
                {/* Timeline Row - Note the added border and contained height */}
                <TableRow className="hover:bg-transparent border-b cursor-pointer" onClick={() => setSelectedNCR(ncr)}>
                  <TableCell colSpan={9} className="py-2">
                    <div className="px-4 flex justify-center">
                      <div className="w-full max-w-4xl mx-auto border border-border rounded-md p-3 relative overflow-hidden">
                        <MilestoneTimeline 
                          items={timelineItems}
                          showLabels={true}
                          size="sm"
                          compact={true}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading NCRs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-lg border border-destructive/50 p-4 max-w-lg mx-auto">
          <h3 className="font-semibold text-destructive mb-2">Error Loading NCRs</h3>
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
          <h3 className="text-lg font-semibold">Non-Conformance Reports</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage product or process non-conformances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <FontAwesomeIcon icon={faFileImport} className="mr-2 h-4 w-4" />
            Import NCRs
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
            New NCR
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All NCRs</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="pending_disposition">Pending Disposition</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All NCRs</CardTitle>
            </CardHeader>
            <CardContent>
              <NCRTable ncrs={ncrs} />
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(groupedNCRs).map(([status, statusNcrs]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>{status.replace('_', ' ').toUpperCase()} NCRs</CardTitle>
              </CardHeader>
              <CardContent>
                <NCRTable ncrs={statusNcrs} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import NCRs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV or Excel file containing NCR data. The file should include the following columns:
                title, description, type, severity, area, lotNumber, quantityAffected
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

      {(showCreateDialog || selectedNCR) && (
        <NCRDialog
          open={showCreateDialog || !!selectedNCR}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setSelectedNCR(null);
            }
          }}
          defaultValues={selectedNCR}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedNCR(null);
            refetch();
          }}
          isEditing={!!selectedNCR}
        />
      )}

      {selectedNCR && !showCreateDialog && (
        <NCRDetailsDialog
          open={!!selectedNCR}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedNCR(null);
            }
          }}
          ncr={selectedNCR}
          onSuccess={() => {
            setSelectedNCR(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}