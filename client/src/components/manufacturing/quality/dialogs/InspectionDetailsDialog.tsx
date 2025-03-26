import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { faEye, faTrashCan, faSpinner, faFile } from '@fortawesome/pro-light-svg-icons';
import { useToast } from "@/hooks/use-toast";
import { QualityInspection, NonConformanceReport } from "@/types/manufacturing";
import { NCRDialog } from "./NCRDialog";
import { useQueryClient } from "@tanstack/react-query";

interface InspectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: QualityInspection;
  onUpdate: (inspection: QualityInspection) => void;
}

interface InspectionItem {
  id: string;
  type?: "number" | "text" | "select";
  label?: string;
  parameter: string;
  specification: string;
  measurement?: string | number;
  status: "pass" | "fail" | "na";
  notes?: string;
}

export function InspectionDetailsDialog({ 
  open, 
  onOpenChange, 
  inspection,
  onUpdate 
}: InspectionDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentInspection, setCurrentInspection] = useState<QualityInspection>(inspection);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [newDefect, setNewDefect] = useState({ description: "", severity: "minor" });
  const [uploadingFile, setUploadingFile] = useState(false);

  const updateLinkedNCRs = async (projectNumber: string) => {
    try {
      const response = await fetch(`/api/manufacturing/quality/inspections/${inspection.id}/update-ncrs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to update linked NCRs');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
    } catch (error) {
      console.error('Error updating linked NCRs:', error);
      toast({
        title: "Warning",
        description: "Project number updated but failed to sync with linked NCRs",
        variant: "destructive",
      });
    }
  };

  const handleProjectNumberChange = async (value: string) => {
    setCurrentInspection(prev => ({
      ...prev,
      projectNumber: value
    }));

    await updateLinkedNCRs(value);
  };

  const handleFieldUpdate = (itemId: string, measurement: string | number) => {
    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        checklistItems: prev.results.checklistItems.map(item => 
          item.id === itemId ? { ...item, measurement, status: measurement ? "pass" : "fail" } : item
        )
      }
    }));
  };

  const handleAddDefect = () => {
    if (!newDefect.description) return;

    const defectItem = {
      id: `DEF-${Date.now()}`,
      description: newDefect.description,
      severity: newDefect.severity as "minor" | "major" | "critical",
      status: "identified" as const,
      timestamp: new Date().toISOString()
    };

    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        defectsFound: [...prev.results.defectsFound, defectItem]
      }
    }));

    setNewDefect({ description: "", severity: "minor" });
  };

  const handleRemoveDefect = (defectId: string) => {
    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        defectsFound: prev.results.defectsFound.filter(d => d.id !== defectId)
      }
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/manufacturing/quality/inspections/${inspection.id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const updatedInspection = await response.json();
      setCurrentInspection(updatedInspection);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(
        `/api/manufacturing/quality/inspections/${inspection.id}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      const updatedInspection = await response.json();
      setCurrentInspection(updatedInspection);

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete attachment",
        variant: "destructive",
      });
    }
  };

  const handleCreateNCR = async () => {
    setShowNCRDialog(true);
  };

  const handleNCRCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
    setShowNCRDialog(false);
    toast({
      title: "Success",
      description: "NCR created successfully from inspection findings",
    });
  };

  const handleSave = async () => {
    try {
      const hasDefects = currentInspection.results.defectsFound.length > 0;
      const allItemsComplete = currentInspection.results.checklistItems.every(
        item => item.status === "pass" || item.status === "fail"
      );
      const hasFailures = currentInspection.results.checklistItems.some(
        item => item.status === "fail"
      );

      const newStatus = hasDefects || hasFailures ? "failed" as const : 
                       allItemsComplete ? "completed" as const : 
                       "in_progress" as const;

      const updatedInspection = {
        ...currentInspection,
        updatedAt: new Date().toISOString(),
        status: newStatus,
        projectNumber: currentInspection.projectNumber
      };
      
      // Save via REST API first (more reliable)
      try {
        console.log('Saving inspection via REST API...');
        
        const response = await fetch(`/api/manufacturing/quality/inspections/${updatedInspection.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedInspection)
        });
        
        if (!response.ok) {
          let errorText = 'Unknown server error';
          try {
            const errorData = await response.json();
            errorText = errorData.error || errorData.details || errorText;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          
          throw new Error(`Server error: ${errorText} (${response.status})`);
        }
        
        const savedInspection = await response.json();
        console.log('Inspection updated successfully via REST API:', savedInspection.id);
        
        // Invalidate React Query cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/inspections'] });
        
        // Update project number on NCRs if needed
        if (updatedInspection.projectNumber !== inspection.projectNumber) {
          await updateLinkedNCRs(updatedInspection.projectNumber || '');
        }
        
        // Also notify connected clients via socket if available
        if (socket) {
          socket.emit('quality:refresh:needed', { 
            timestamp: new Date().toISOString(),
            message: 'Inspection updated via REST API' 
          });
        }
        
        // Call the parent component's onUpdate handler
        onUpdate(savedInspection);
        
        // Show success message
        toast({
          title: "Success",
          description: "Inspection details have been updated.",
        });
      } catch (restError) {
        console.error('REST API failed, falling back to socket:', restError);
        
        // Fallback to socket approach
        if (!socket) {
          throw new Error('Connection error: REST API failed and socket connection not available');
        }
        
        // Use the original parent component handler which uses socket
        onUpdate(updatedInspection);
        
        // Show success message but with a note about using fallback
        toast({
          title: "Success",
          description: "Inspection details have been updated (socket fallback used).",
        });
      }
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update inspection details.",
        variant: "destructive",
      });
    }
  };

  const getItemType = (item: InspectionItem): "number" | "text" | "select" => {
    const parameterLower = item.parameter?.toLowerCase() || '';
    const specificationLower = item.specification?.toLowerCase() || '';

    if (item.type) {
      return item.type;
    }

    if (parameterLower.includes('measurement') || 
        specificationLower.includes('numeric') ||
        parameterLower.includes('dimension') ||
        parameterLower.includes('weight') ||
        parameterLower.includes('quantity')) {
      return "number";
    }

    if (specificationLower.includes('pass/fail') ||
        specificationLower.includes('yes/no') ||
        parameterLower.includes('check')) {
      return "select";
    }

    return "text";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ID: {inspection.id}</span>
              <span>•</span>
              <span>Type: {inspection.templateType}</span>
              <span>•</span>
              <Badge>{inspection.status}</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project Number</label>
                  <Input
                    type="text"
                    value={currentInspection.projectNumber || ""}
                    onChange={(e) => handleProjectNumberChange(e.target.value)}
                    placeholder="Enter project number"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {currentInspection.results.checklistItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <label className="text-sm font-medium">
                    {item.label || item.parameter}
                  </label>
                  {getItemType(item) === "number" && (
                    <Input
                      type="number"
                      value={item.measurement || ""}
                      onChange={(e) => handleFieldUpdate(item.id, e.target.value)}
                    />
                  )}
                  {getItemType(item) === "text" && (
                    <Input
                      type="text"
                      value={item.measurement || ""}
                      onChange={(e) => handleFieldUpdate(item.id, e.target.value)}
                    />
                  )}
                  {getItemType(item) === "select" && (
                    <Select
                      value={item.measurement?.toString() || ""}
                      onValueChange={(value) => handleFieldUpdate(item.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Badge variant={item.status === "pass" ? "default" : "secondary"} className="mt-1">
                    {item.status}
                  </Badge>
                </div>
              ))}

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Attachments</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    {uploadingFile && (
                      <div className="animate-spin">
                        <FontAwesomeIcon icon={faSpinner} className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {currentInspection.attachments?.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faFile} className="h-4 w-4" />
                          <span>{attachment.fileName}</span>
                          <span className="text-sm text-muted-foreground">
                            ({Math.round(attachment.fileSize / 1024)} KB)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(attachment.blobUrl, '_blank')}
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h4 className="font-medium">Defects Found</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter defect description"
                    value={newDefect.description}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Select
                    value={newDefect.severity}
                    onValueChange={(value) => setNewDefect(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddDefect}>Add Defect</Button>
                </div>

                <div className="space-y-2">
                  {currentInspection.results.defectsFound.map((defect) => (
                    <div key={defect.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          defect.severity === "critical" ? "destructive" :
                          defect.severity === "major" ? "default" : "secondary"
                        }>
                          {defect.severity}
                        </Badge>
                        <span>{defect.description}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDefect(defect.id)}>
                        <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {currentInspection.results.defectsFound.length > 0 && (
                  <Button 
                    variant="destructive"
                    onClick={handleCreateNCR}
                    className="w-full"
                  >
                    Create NCR for Defects
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showNCRDialog && (
        <NCRDialog
          open={showNCRDialog}
          onOpenChange={setShowNCRDialog}
          inspection={currentInspection}
          onSuccess={handleNCRCreated}
        />
      )}
    </>
  );
}