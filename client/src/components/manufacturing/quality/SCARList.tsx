import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus,
  faFileImport,
  faEye,
  faEdit,
  faPaperPlane,
  faCheckSquare,
  faEllipsisVertical,
  faTrash
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { SCAR } from "@/types/manufacturing/scar";
import { SCARDialog } from "./dialogs/SCARDialog";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SCARStatus = SCAR['status'];

const STATUS_GROUPS = {
  open: ["draft", "issued"] as SCARStatus[],
  in_progress: ["supplier_response", "review"] as SCARStatus[],
  closed: ["closed"] as SCARStatus[]
} as const;

type StatusGroupKey = keyof typeof STATUS_GROUPS;

const fetchSCARs = async (): Promise<SCAR[]> => {
  const response = await fetch('/api/manufacturing/quality/scars');
  if (!response.ok) {
    throw new Error('Failed to fetch SCARs');
  }
  return response.json();
};

export default function SCARList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedSCAR, setSelectedSCAR] = useState<SCAR | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<StatusGroupKey | 'all'>('all');

  const { data: scars = [], isLoading } = useQuery<SCAR[]>({
    queryKey: ['/api/manufacturing/quality/scars'],
    queryFn: fetchSCARs,
  });

  const filteredSCARs = scars.filter(scar => 
    activeTab === 'all' ? true : STATUS_GROUPS[activeTab as StatusGroupKey].includes(scar.status)
  );

  const getStatusBadgeVariant = (status: SCARStatus): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'issued':
        return 'default';
      case 'supplier_response':
        return 'default';
      case 'review':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'major':
        return 'destructive';
      case 'minor':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

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
      const response = await fetch('/api/manufacturing/quality/scars/import', {
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
        description: `Successfully imported ${result.count} SCARs`
      });

      setShowImportDialog(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/scars'] });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import SCARs",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (scarId: string) => {
    if (!window.confirm('Are you sure you want to delete this SCAR?')) {
      return;
    }

    try {
      const response = await fetch(`/api/manufacturing/quality/scars/${scarId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete SCAR');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/scars'] });

      toast({
        title: "Success",
        description: "SCAR deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting SCAR:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete SCAR",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading SCARs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Supplier Corrective Action Reports</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage supplier quality issues and corrective actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <FontAwesomeIcon icon={faFileImport} className="mr-2 h-4 w-4" />
            Import SCARs
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
            New SCAR
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SCAR List</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as StatusGroupKey | 'all')}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {scars.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="open">
                Open
                <Badge variant="secondary" className="ml-2">
                  {scars.filter(scar => STATUS_GROUPS.open.includes(scar.status)).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress
                <Badge variant="secondary" className="ml-2">
                  {scars.filter(scar => STATUS_GROUPS.in_progress.includes(scar.status)).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed
                <Badge variant="secondary" className="ml-2">
                  {scars.filter(scar => STATUS_GROUPS.closed.includes(scar.status)).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SCAR #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Response Required</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSCARs.map((scar) => (
                  <TableRow key={scar.id}>
                    <TableCell className="font-medium">{scar.number}</TableCell>
                    <TableCell>{scar.supplierName}</TableCell>
                    <TableCell className="capitalize">{scar.issue.category}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(scar.issue.severity)}>
                        {scar.issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(scar.status)}>
                        {scar.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(scar.issueDate)}</TableCell>
                    <TableCell>{formatDate(scar.responseRequired)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedSCAR(scar)}>
                            <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedSCAR(scar)}>
                            <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(scar.id)} className="text-destructive">
                            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FontAwesomeIcon icon={faCheckSquare} className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FontAwesomeIcon icon={faPaperPlane} className="mr-2 h-4 w-4" />
                            Send to Supplier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import SCARs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV or Excel file containing SCAR data. The file should include the following columns:
                supplier_name, issue_category, issue_severity, description, response_required_date
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

      <SCARDialog
        open={showCreateDialog || !!selectedSCAR}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedSCAR(null);
        }}
        initialData={selectedSCAR ?? undefined}
        onSuccess={() => {
          toast({
            title: "Success",
            description: selectedSCAR 
              ? "SCAR updated successfully"
              : "SCAR created successfully",
          });
          queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/scars'] });
        }}
      />
    </div>
  );
}