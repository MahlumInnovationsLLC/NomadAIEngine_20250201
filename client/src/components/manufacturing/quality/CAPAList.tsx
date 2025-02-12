import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { CAPA } from "@/types/manufacturing/capa";
import { CAPADialog } from "./dialogs/CAPADialog";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CAPACategory {
  id: number;
  name: string;
  description: string | null;
  severity: string;
  requires_approval: boolean;
}

const fetchCAPAs = async (): Promise<CAPA[]> => {
  const response = await fetch('/api/manufacturing/quality/capas');
  if (!response.ok) {
    throw new Error('Failed to fetch CAPAs');
  }
  return response.json();
};

const fetchCategories = async (): Promise<CAPACategory[]> => {
  const response = await fetch('/api/manufacturing/quality/capa-categories');
  if (!response.ok) {
    throw new Error('Failed to fetch CAPA categories');
  }
  return response.json();
};

export default function CAPAList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data: capas = [], isLoading: isLoadingCAPAs, refetch } = useQuery<CAPA[]>({
    queryKey: ['/api/manufacturing/quality/capas'],
    queryFn: fetchCAPAs,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<CAPACategory[]>({
    queryKey: ['/api/manufacturing/quality/capa-categories'],
    queryFn: fetchCategories,
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
      const response = await fetch('/api/manufacturing/quality/capas/import', {
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
        description: `Successfully imported ${result.count} CAPAs`
      });

      setShowImportDialog(false);
      setImportFile(null);
      refetch();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CAPAs",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'open':
        return 'default';
      case 'in_progress':
      case 'implementing':
        return 'default';
      case 'pending_review':
      case 'under_investigation':
        return 'secondary';
      case 'pending_verification':
        return 'outline';
      case 'completed':
        return 'secondary';
      case 'verified':
        return 'default';
      case 'closed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getSourceInfo = (capa: CAPA) => {
    if (capa.sourceNcrId) {
      return `NCR: ${capa.sourceNcrId}`;
    }
    if (capa.sourceInspectionId) {
      return `Inspection: ${capa.sourceInspectionId}`;
    }
    return "Manual Creation";
  };

  const filteredCAPAs = selectedCategory
    ? capas.filter(capa => capa.category_id?.toString() === selectedCategory)
    : capas;

  if (isLoadingCAPAs || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading CAPAs...</p>
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
            Manage and track corrective actions and preventive measures
          </p>
        </div>
        <div className="flex gap-4">
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name} ({category.severity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
            Import CAPAs
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            Create New CAPA
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CAPA List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CAPA #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCAPAs.map((capa) => (
                <TableRow key={capa.id}>
                  <TableCell className="font-medium">{capa.number}</TableCell>
                  <TableCell>{capa.title}</TableCell>
                  <TableCell className="capitalize">{capa.type}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(capa.priority)}>
                      {capa.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(capa.status)}>
                      {capa.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {categories.find(c => c.id === capa.category_id)?.name ?? 'N/A'}
                  </TableCell>
                  <TableCell>{capa.department}</TableCell>
                  <TableCell>{getSourceInfo(capa)}</TableCell>
                  <TableCell>{formatDate(capa.createdAt)}</TableCell>
                  <TableCell>{formatDate(capa.scheduledReviewDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedCAPA(capa)}>
                          <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="check-square" className="mr-2 h-4 w-4" />
                          Update Status
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
                title, description, type, priority, area, category_id, department
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

      <CAPADialog
        open={showCreateDialog || !!selectedCAPA}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedCAPA(null);
        }}
        initialData={selectedCAPA ?? undefined}
        onSuccess={() => {
          toast({
            title: "Success",
            description: selectedCAPA 
              ? "CAPA updated successfully"
              : "CAPA created successfully",
          });
          refetch();
        }}
      />
    </div>
  );
}