import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { NonConformanceReport } from "@/types/manufacturing/ncr";
import { NCRDialog } from "./dialogs/NCRDialog";
import { NCRDetailsDialog } from "./dialogs/NCRDetailsDialog";
import * as z from "zod";

// Import our common components
import {
  QMSFilters,
  QMSFilterOptions,
  QMSBatchOperations,
  WorkflowStatusTransition,
  DocumentAttachmentsList,
  DocumentPreview,
  DocumentAttachment,
  AuditTrail,
  AuditEntry,
  QMSRelationships,
  QMSRelation
} from "./common";

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

// Sample audit trail entries getter
const fetchNCRAuditTrail = async (ncrId: string): Promise<AuditEntry[]> => {
  try {
    const response = await fetch(`/api/manufacturing/quality/ncrs/${ncrId}/audit-trail`);
    if (!response.ok) {
      throw new Error(`Failed to fetch audit trail: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    return [];
  }
};

// Sample related items getter
const fetchNCRRelationships = async (ncrId: string): Promise<{
  relations: QMSRelation[];
  items: any[];
}> => {
  try {
    const response = await fetch(`/api/manufacturing/quality/ncrs/${ncrId}/relationships`);
    if (!response.ok) {
      throw new Error(`Failed to fetch relationships: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching relationships:", error);
    return { relations: [], items: [] };
  }
};

export function EnhancedNCRList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  
  // State for CRUD operations
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NonConformanceReport | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // State for advanced features
  const [filters, setFilters] = useState<QMSFilterOptions>({
    search: "",
    status: [],
    type: [],
    severity: [],
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentAttachment | null>(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch NCRs
  const { data: ncrs = [], isLoading, error, refetch } = useQuery<NonConformanceReport[]>({
    queryKey: ['/api/manufacturing/quality/ncrs'],
    queryFn: fetchNCRs,
    staleTime: 5000,
    retry: 2
  });

  // Fetch audit trail for selected NCR
  const { data: auditTrail = [] } = useQuery<AuditEntry[]>({
    queryKey: ['/api/manufacturing/quality/ncrs/audit-trail', selectedNCR?.id],
    queryFn: () => selectedNCR ? fetchNCRAuditTrail(selectedNCR.id) : Promise.resolve([]),
    enabled: !!selectedNCR,
    staleTime: 10000,
  });

  // Fetch relationships for selected NCR
  const { data: relationships = { relations: [], items: [] } } = useQuery({
    queryKey: ['/api/manufacturing/quality/ncrs/relationships', selectedNCR?.id],
    queryFn: () => selectedNCR ? fetchNCRRelationships(selectedNCR.id) : Promise.resolve({ relations: [], items: [] }),
    enabled: !!selectedNCR,
    staleTime: 10000,
  });

  // Mutations
  const createNCRMutation = useMutation({
    mutationFn: async (ncrData: Partial<NonConformanceReport>) => {
      const response = await fetch('/api/manufacturing/quality/ncrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncrData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create NCR');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      toast({
        title: "Success",
        description: "NCR created successfully",
      });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNCRMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NonConformanceReport> }) => {
      const response = await fetch(`/api/manufacturing/quality/ncrs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update NCR');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      toast({
        title: "Success",
        description: "NCR updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNCRMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/manufacturing/quality/ncrs/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete NCR');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      toast({
        title: "Success",
        description: "NCR deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const batchDeleteNCRsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/manufacturing/quality/ncrs/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete NCRs');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      toast({
        title: "Success",
        description: "NCRs deleted successfully",
      });
      setSelectedItems([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ ncrId, file }: { ncrId: string, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/manufacturing/quality/ncrs/${ncrId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload attachment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      toast({
        title: "Success",
        description: "Attachment uploaded successfully",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ ncrId, attachmentId }: { ncrId: string, attachmentId: string }) => {
      const response = await fetch(`/api/manufacturing/quality/ncrs/${ncrId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete attachment');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
      setSelectedAttachment(null);
      setShowAttachmentPreview(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateNCR = (data: Partial<NonConformanceReport>) => {
    createNCRMutation.mutate(data);
  };

  const handleUpdateNCR = (ncr: NonConformanceReport, updates: Partial<NonConformanceReport>) => {
    updateNCRMutation.mutate({ id: ncr.id, updates });
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
      refetch();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import NCRs",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = (ncrId: string, newStatus: string, data: any) => {
    const ncr = ncrs.find(n => n.id === ncrId);
    if (!ncr) return;
    
    updateNCRMutation.mutate({
      id: ncrId,
      updates: {
        ...ncr,
        status: newStatus as NonConformanceReport['status'],
      }
    });
  };

  const handleUploadAttachment = async (file: File) => {
    if (!selectedNCR) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      await uploadAttachmentMutation.mutateAsync({
        ncrId: selectedNCR.id,
        file
      });
      clearInterval(interval);
      setUploadProgress(100);
    } catch (error) {
      clearInterval(interval);
      setUploadProgress(0);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!selectedNCR || !selectedAttachment) return;
    
    return deleteAttachmentMutation.mutateAsync({
      ncrId: selectedNCR.id,
      attachmentId: selectedAttachment.id
    });
  };

  // Create CAPA from NCR
  const handleCreateCAPA = (ncr: NonConformanceReport) => {
    if (socket) {
      socket.emit('quality:capa:create-from-ncr', { ncrId: ncr.id });
      toast({
        title: "CAPA Creation Initiated",
        description: "Redirecting to CAPA creation form"
      });
    } else {
      toast({
        title: "Connection Error",
        description: "WebSocket connection not available",
        variant: "destructive"
      });
    }
  };

  // Filtering
  const filteredNCRs = ncrs.filter(ncr => {
    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        ncr.title.toLowerCase().includes(searchLower) ||
        ncr.description.toLowerCase().includes(searchLower) ||
        ncr.number.toLowerCase().includes(searchLower) ||
        (ncr.reportedBy && ncr.reportedBy.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(ncr.status)) {
      return false;
    }
    
    // Type filter
    if (filters.type.length > 0 && !filters.type.includes(ncr.type)) {
      return false;
    }
    
    // Severity filter
    if (filters.severity.length > 0 && !filters.severity.includes(ncr.severity)) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const ncrDate = new Date(ncr.createdAt);
      
      if (filters.dateRange.from && ncrDate < filters.dateRange.from) {
        return false;
      }
      
      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999); // End of day
        
        if (ncrDate > toDate) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Selection handlers
  const handleSelectNCR = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(filteredNCRs.map(ncr => ncr.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Batch operations
  const batchOperations = [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: 'trash',
      action: async (ids: string[]) => {
        await batchDeleteNCRsMutation.mutateAsync(ids);
      },
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to delete the selected NCRs? This action cannot be undone.'
    },
    {
      id: 'status-update',
      label: 'Update Status',
      icon: 'arrow-right',
      action: async (ids: string[], data: { newStatus: string }) => {
        // Implement batch status update
        for (const id of ids) {
          await updateNCRMutation.mutateAsync({
            id,
            updates: { status: data.newStatus as NonConformanceReport['status'] }
          });
        }
      },
      formSchema: z.object({
        newStatus: z.string().min(1, "Status is required")
      }),
      renderForm: (form: any) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <select
              className="w-full border rounded-md p-2"
              {...form.register("newStatus")}
            >
              <option value="">Select status...</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="pending_disposition">Pending Disposition</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
            {form.formState.errors.newStatus && (
              <p className="text-sm text-red-500">
                {form.formState.errors.newStatus.message}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: 'file-export',
      action: async (ids: string[]) => {
        // Implement export functionality
        const selectedNCRs = ncrs.filter(ncr => ids.includes(ncr.id));
        const jsonStr = JSON.stringify(selectedNCRs, null, 2);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "ncrs_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    }
  ];

  // Workflow transitions
  const ncrWorkflowTransitions = [
    {
      from: 'draft',
      to: 'open',
      label: 'Submit',
      icon: 'paper-plane',
      requiresComment: true
    },
    {
      from: 'open',
      to: 'under_review',
      label: 'Start Review',
      icon: 'clipboard-check'
    },
    {
      from: 'under_review',
      to: 'pending_disposition',
      label: 'Request Disposition',
      icon: 'clipboard-list'
    },
    {
      from: 'under_review',
      to: 'closed',
      label: 'Close',
      icon: 'check-circle',
      requiresComment: true,
      requiresReason: true,
      reasons: [
        'Issue Resolved',
        'Not a Non-Conformance',
        'Duplicate Entry',
        'Other'
      ]
    },
    {
      from: 'pending_disposition',
      to: 'closed',
      label: 'Close with Disposition',
      icon: 'check-double',
      requiresComment: true,
      fieldValidation: {
        disposition: {
          required: true,
          message: 'Disposition is required'
        }
      }
    },
    {
      from: 'closed',
      to: 'open',
      label: 'Reopen',
      icon: 'rotate',
      requiresComment: true,
      requiresReason: true
    }
  ];

  // Status colors for badges
  const statusColors = {
    'draft': 'secondary',
    'open': 'default',
    'under_review': 'warning',
    'pending_disposition': 'default',
    'closed': 'success'
  };

  // NCR render item for batch operations
  const renderNCRItem = (ncr: NonConformanceReport, isSelected: boolean, onSelect: (selected: boolean) => void) => (
    <div 
      className={`p-4 border rounded-lg transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
    >
      <div className="flex items-start">
        <div className="flex items-center h-5 mr-3 mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
        <div className="flex-1 min-w-0" onClick={() => setSelectedNCR(ncr)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{ncr.number}</h4>
              <Badge variant={statusColors[ncr.status] || 'default'}>
                {ncr.status.replace('_', ' ')}
              </Badge>
              <Badge variant={ncr.severity === 'critical' ? 'destructive' : 'outline'}>
                {ncr.severity}
              </Badge>
            </div>
          </div>
          <p className="text-sm mt-1 truncate">{ncr.title}</p>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Reported by: {ncr.reportedBy || 'Unknown'}</span>
            <span>Created: {new Date(ncr.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
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
            <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
            Import NCRs
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New NCR
          </Button>
        </div>
      </div>

      {/* Filters */}
      <QMSFilters
        title="NCR Filters"
        description="Filter and search non-conformance reports"
        options={{
          statuses: [
            { value: 'open', label: 'Open' },
            { value: 'under_review', label: 'Under Review' },
            { value: 'pending_disposition', label: 'Pending Disposition' },
            { value: 'closed', label: 'Closed' },
            { value: 'draft', label: 'Draft' }
          ],
          types: [
            { value: 'product', label: 'Product' },
            { value: 'process', label: 'Process' },
            { value: 'material', label: 'Material' },
            { value: 'documentation', label: 'Documentation' }
          ],
          severities: [
            { value: 'minor', label: 'Minor' },
            { value: 'major', label: 'Major' },
            { value: 'critical', label: 'Critical' }
          ]
        }}
        activeFilters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({
          search: "",
          status: [],
          type: [],
          severity: [],
          dateRange: {
            from: undefined,
            to: undefined,
          },
        })}
        itemCount={ncrs.length}
        filteredCount={filteredNCRs.length}
      />

      {/* Batch Operations & Items */}
      <QMSBatchOperations
        items={filteredNCRs}
        selectedItems={selectedItems}
        onSelectItem={handleSelectNCR}
        onSelectAll={handleSelectAll}
        batchActions={batchOperations}
        itemRenderer={renderNCRItem}
      />

      {/* Selected NCR Details */}
      {selectedNCR && (
        <div className="space-y-4 mt-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedNCR.number}
                    <Badge variant={statusColors[selectedNCR.status] || 'default'}>
                      {selectedNCR.status.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                  <p className="text-xl font-medium mt-1">{selectedNCR.title}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedNCR(null)}>
                  <FontAwesomeIcon icon="arrow-left" className="mr-2 h-4 w-4" />
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Type</h4>
                      <p className="capitalize">{selectedNCR.type}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Severity</h4>
                      <Badge variant={selectedNCR.severity === 'critical' ? 'destructive' : 'outline'}>
                        {selectedNCR.severity}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Area</h4>
                      <p>{selectedNCR.area || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Reported By</h4>
                      <p>{selectedNCR.reportedBy || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Project Number</h4>
                      <p>{selectedNCR.projectNumber || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Created</h4>
                      <p>{new Date(selectedNCR.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="whitespace-pre-wrap">{selectedNCR.description}</p>
                    </div>
                  </div>
                  
                  {/* Workflow Status Transition */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">Status Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WorkflowStatusTransition
                        currentStatus={selectedNCR.status}
                        itemId={selectedNCR.id}
                        itemTypeLabel="NCR"
                        transitions={ncrWorkflowTransitions}
                        statusColors={statusColors}
                        formFields={[
                          {
                            name: 'disposition',
                            label: 'Disposition',
                            type: 'select',
                            options: [
                              { value: 'use_as_is', label: 'Use As Is' },
                              { value: 'rework', label: 'Rework' },
                              { value: 'repair', label: 'Repair' },
                              { value: 'scrap', label: 'Scrap' },
                              { value: 'return_to_supplier', label: 'Return to Supplier' }
                            ]
                          }
                        ]}
                        onTransitionComplete={(newStatus, data) => handleStatusChange(selectedNCR.id, newStatus, data)}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                      <FontAwesomeIcon icon="pen" className="mr-2 h-4 w-4" />
                      Edit NCR
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleCreateCAPA(selectedNCR)}
                    >
                      <FontAwesomeIcon icon="diagram-project" className="mr-2 h-4 w-4" />
                      Create CAPA
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this NCR?')) {
                          deleteNCRMutation.mutate(selectedNCR.id);
                          setSelectedNCR(null);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon="trash" className="mr-2 h-4 w-4" />
                      Delete NCR
                    </Button>
                  </div>
                  
                  {/* Attachments */}
                  <div>
                    <h4 className="font-medium mb-2">Attachments</h4>
                    <DocumentAttachmentsList
                      attachments={selectedNCR.attachments || []}
                      onViewAttachment={(attachment) => {
                        setSelectedAttachment(attachment);
                        setShowAttachmentPreview(true);
                      }}
                      onUploadAttachment={handleUploadAttachment}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                      maxFileSizeMB={10}
                      allowedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']}
                    />
                  </div>
                </div>
                
                {/* Right Column - Audit & Relations */}
                <div className="space-y-6">
                  {/* Related Items */}
                  <QMSRelationships
                    currentItem={selectedNCR}
                    relations={relationships.relations}
                    relatedItems={relationships.items}
                    availableTypes={[
                      { type: 'capa', label: 'CAPA', icon: 'diagram-project' },
                      { type: 'mrb', label: 'MRB', icon: 'clipboard-list' },
                      { type: 'scar', label: 'SCAR', icon: 'triangle-exclamation' }
                    ]}
                    onCreateRelatedItem={(sourceItem, targetType) => {
                      // Handle creating related item (e.g., open dialog or navigate)
                      toast({
                        title: "Creating Related Item",
                        description: `Creating ${targetType} from NCR ${sourceItem.number}`
                      });
                    }}
                    onLinkExistingItem={async (sourceItem, targetItem, relationType) => {
                      // Handle linking existing item
                      toast({
                        title: "Items Linked",
                        description: `Linked ${sourceItem.number} to ${targetItem.number}`
                      });
                      return Promise.resolve();
                    }}
                    onRemoveRelation={async (relation) => {
                      // Handle removing relation
                      toast({
                        title: "Relationship Removed",
                        description: "The relationship has been successfully removed"
                      });
                      return Promise.resolve();
                    }}
                    onViewRelatedItem={(item) => {
                      // Handle viewing related item
                      toast({
                        title: "Viewing Related Item",
                        description: `Redirecting to ${item.type} ${item.number}`
                      });
                    }}
                    statusColors={statusColors}
                  />
                  
                  {/* Audit Trail */}
                  <AuditTrail
                    entries={auditTrail}
                    itemId={selectedNCR.id}
                    itemType="NCR"
                    statusColors={statusColors}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <NCRDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          defaultValues={selectedNCR}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedNCR(null);
            refetch();
          }}
          isEditing={!!selectedNCR}
        />
      )}

      {/* Attachment Preview */}
      {selectedAttachment && showAttachmentPreview && (
        <DocumentPreview
          attachment={selectedAttachment}
          onClose={() => {
            setSelectedAttachment(null);
            setShowAttachmentPreview(false);
          }}
          onDelete={handleDeleteAttachment}
        />
      )}
    </div>
  );
}