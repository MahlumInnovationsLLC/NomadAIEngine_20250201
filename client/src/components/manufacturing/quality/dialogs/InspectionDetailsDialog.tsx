import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { faEye, faTrashCan, faSpinner, faFile, faCamera, faLocationDot, faUserTag, faPlus, faTimes, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useToast } from "@/hooks/use-toast";
import { QualityInspection, NonConformanceReport, Project } from "@/types/manufacturing";
import { NCRDialog } from "./NCRDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";

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
  const [newDefect, setNewDefect] = useState({
    description: "",
    severity: "minor" as "minor" | "major" | "critical",
    location: "",
    assignedTo: "",
    photos: [] as string[]
  });
  const [editingDefectId, setEditingDefectId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingDefectPhoto, setUploadingDefectPhoto] = useState(false);

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
    setCurrentInspection(prev => {
      // Create a safe copy with empty array if checklistItems is undefined
      const checklistItems = prev.results.checklistItems || [];
      
      return {
        ...prev,
        results: {
          ...prev.results,
          checklistItems: checklistItems.map(item => 
            item.id === itemId ? { ...item, measurement, status: measurement ? "pass" : "fail" } : item
          )
        }
      };
    });
  };

  const handleStartEditDefect = (defectId: string) => {
    // Find the defect to edit
    const defectToEdit = currentInspection.results.defectsFound.find(d => d.id === defectId);
    if (!defectToEdit) return;

    // Set the form values with the existing defect data
    setNewDefect({
      description: defectToEdit.description,
      severity: defectToEdit.severity as "minor" | "major" | "critical",
      location: defectToEdit.location || "",
      assignedTo: defectToEdit.assignedTo || "",
      photos: defectToEdit.photos || []
    });

    // Set the editing state
    setEditingDefectId(defectId);
    setIsEditing(true);

    // Scroll form into view
    const formElement = document.getElementById('defect-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    // Reset the form
    setNewDefect({
      description: "",
      severity: "minor",
      location: "",
      assignedTo: "",
      photos: []
    });
    setEditingDefectId(null);
    setIsEditing(false);
  };

  const handleAddDefect = () => {
    if (!newDefect.description) return;

    if (isEditing && editingDefectId) {
      // Update existing defect
      setCurrentInspection(prev => ({
        ...prev,
        results: {
          ...prev.results,
          defectsFound: prev.results.defectsFound.map(defect => 
            defect.id === editingDefectId 
              ? {
                  ...defect,
                  description: newDefect.description,
                  severity: newDefect.severity,
                  location: newDefect.location,
                  assignedTo: newDefect.assignedTo,
                  photos: newDefect.photos
                }
              : defect
          )
        }
      }));

      toast({
        title: "Success",
        description: "Defect updated successfully",
      });

      // Reset edit mode
      setIsEditing(false);
      setEditingDefectId(null);
    } else {
      // Create a new defect
      const defectItem = {
        id: `DEF-${Date.now()}`,
        description: newDefect.description,
        severity: newDefect.severity,
        status: "open" as "open" | "in_progress" | "closed", // Using valid status from the interface
        createdAt: new Date().toISOString(),
        location: newDefect.location,
        assignedTo: newDefect.assignedTo,
        photos: newDefect.photos
      };

      setCurrentInspection(prev => ({
        ...prev,
        results: {
          ...prev.results,
          defectsFound: [...prev.results.defectsFound, defectItem]
        }
      }));
    }

    // Reset the form
    setNewDefect({
      description: "",
      severity: "minor",
      location: "",
      assignedTo: "",
      photos: []
    });
  };

  const handleRemoveDefect = async (defectId: string) => {
    // Find the defect to get its photos
    const defect = currentInspection.results.defectsFound.find(d => d.id === defectId);
    
    if (defect && defect.photos && defect.photos.length > 0) {
      // Delete all associated photos from the server
      for (const photoUrl of defect.photos) {
        if (photoUrl.includes('#')) {
          try {
            const photoId = photoUrl.split('#')[1];
            if (photoId) {
              // Call API to delete the photo
              await fetch(`/api/manufacturing/quality/defect-photos/${photoId}`, {
                method: 'DELETE'
              });
              console.log(`Deleted defect photo: ${photoId}`);
            }
          } catch (error) {
            console.error('Error deleting defect photo:', error);
          }
        }
      }
    }
    
    // Remove the defect from the current inspection
    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        defectsFound: prev.results.defectsFound.filter(d => d.id !== defectId)
      }
    }));
    
    toast({
      title: "Success",
      description: "Defect removed successfully",
    });
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
  
  const handleDefectPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDefectPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Uploading new defect photo...');
      
      // Upload the photo to the server and get the URL
      const response = await fetch(`/api/manufacturing/quality/defect-photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload defect photo');
      }

      const { url, id } = await response.json();
      console.log('Photo uploaded successfully, URL:', url, 'ID:', id);
      
      // Create a photo URL with ID embedded for tracking
      const photoUrlWithId = `${url}#${id}`;
      
      // Store both the URL and ID for the photo
      setNewDefect(prev => ({
        ...prev,
        // Store photo URLs with IDs to facilitate deletion later
        photos: [...(prev.photos || []), photoUrlWithId]
      }));

      toast({
        title: "Success",
        description: "Defect photo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading defect photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload defect photo",
        variant: "destructive",
      });
    } finally {
      setUploadingDefectPhoto(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  const handleExistingDefectPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, defectId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDefectPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log(`Uploading photo for existing defect ID: ${defectId}`);
      
      // Upload the photo to the server and get the URL
      const response = await fetch(`/api/manufacturing/quality/defect-photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload defect photo');
      }

      const { url, id } = await response.json();
      console.log('Photo uploaded successfully for existing defect, URL:', url, 'ID:', id);
      
      const photoUrlWithId = `${url}#${id}`;
      
      // Find the defect to ensure it exists before updating
      const defect = currentInspection.results.defectsFound.find(d => d.id === defectId);
      if (!defect) {
        throw new Error(`Defect with ID ${defectId} not found`);
      }
      
      console.log('Adding photo to defect:', defect.description);
      
      // Update the defect in the current inspection
      setCurrentInspection(prev => ({
        ...prev,
        results: {
          ...prev.results,
          defectsFound: prev.results.defectsFound.map(defect => 
            defect.id === defectId 
              ? {
                  ...defect,
                  photos: [...(defect.photos || []), photoUrlWithId],
                  // Ensure location and assignment are preserved
                  location: defect.location,
                  assignedTo: defect.assignedTo
                }
              : defect
          )
        }
      }));

      toast({
        title: "Success",
        description: "Photo added to defect successfully",
      });
    } catch (error) {
      console.error('Error uploading defect photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload defect photo",
        variant: "destructive",
      });
    } finally {
      setUploadingDefectPhoto(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  const handleDeleteDefectPhoto = async (photoUrl: string) => {
    try {
      // Extract the photo ID from the URL (format: url#id)
      const photoId = photoUrl.split('#').pop();
      if (!photoId) {
        throw new Error('Invalid photo URL format');
      }
      
      // Delete the photo from the server
      const response = await fetch(`/api/manufacturing/quality/defect-photos/${photoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete defect photo');
      }

      // Remove the photo from the newDefect state
      setNewDefect(prev => ({
        ...prev,
        photos: prev.photos.filter(photo => photo !== photoUrl)
      }));

      toast({
        title: "Success",
        description: "Defect photo deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting defect photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete defect photo",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteExistingDefectPhoto = async (photoUrl: string, defectId: string) => {
    try {
      console.log(`Deleting photo from existing defect ID: ${defectId}`);
      
      // Extract the photo ID from the URL (format: url#id)
      const photoId = photoUrl.split('#').pop();
      if (!photoId) {
        throw new Error('Invalid photo URL format');
      }
      
      console.log(`Extracted photo ID: ${photoId}`);
      
      // Find the defect to ensure it exists before updating
      const defect = currentInspection.results.defectsFound.find(d => d.id === defectId);
      if (!defect) {
        throw new Error(`Defect with ID ${defectId} not found`);
      }
      
      // Delete the photo from the server
      const response = await fetch(`/api/manufacturing/quality/defect-photos/${photoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete defect photo');
      }

      console.log(`Photo with ID ${photoId} successfully deleted from server`);
      
      // Remove the photo from the defect in the current inspection
      setCurrentInspection(prev => ({
        ...prev,
        results: {
          ...prev.results,
          defectsFound: prev.results.defectsFound.map(defect => 
            defect.id === defectId 
              ? {
                  ...defect,
                  photos: (defect.photos || []).filter(photo => photo !== photoUrl),
                  // Ensure location and assignment are preserved
                  location: defect.location,
                  assignedTo: defect.assignedTo
                }
              : defect
          )
        }
      }));

      toast({
        title: "Success",
        description: "Defect photo deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting defect photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete defect photo",
        variant: "destructive",
      });
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
      
      // Safe checks for checklistItems which could be undefined
      const checklistItems = currentInspection.results.checklistItems || [];
      const allItemsComplete = checklistItems.length > 0 ? 
        checklistItems.every(item => item.status === "pass" || item.status === "fail") : 
        true;
      const hasFailures = checklistItems.length > 0 ? 
        checklistItems.some(item => item.status === "fail") : 
        false;

      const newStatus = hasDefects || hasFailures ? "failed" as const : 
                       allItemsComplete ? "completed" as const : 
                       "in_progress" as const;

      // Ensure we explicitly preserve all fields, especially projectNumber and location
      // which were getting lost in some scenarios
      const updatedInspection = {
        ...currentInspection,
        updatedAt: new Date().toISOString(),
        status: newStatus,
        projectNumber: currentInspection.projectNumber,
        projectId: currentInspection.projectId,
        location: currentInspection.location
      };
      
      // Generate a unique ID for this toast
      const toastId = `save-${Date.now()}`;
            
      // Show loading toast
      toast({
        id: toastId,
        title: "Saving changes...",
        description: "Updating inspection details",
      });
      
      // First, immediately update the parent to reflect changes in the UI
      onUpdate(updatedInspection);
        
      // Save via REST API to persist changes
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
        
        // Call the parent component's onUpdate handler with the saved inspection
        // We want the UI to update immediately to show changes
        onUpdate(savedInspection);
        
        // Close the dialog after successful save
        onOpenChange(false);
        
        // Show success message
        toast({
          id: toastId,
          title: "Success",
          description: "Inspection details have been updated.",
        });
      } catch (restError) {
        console.error('REST API failed, falling back to socket:', restError);
        
        // Fallback to socket approach
        if (!socket) {
          throw new Error('Connection error: REST API failed and socket connection not available');
        }
        
        try {
          // Define a handler for the update confirmation
          const handleUpdateConfirmation = (response: any) => {
            console.log('[InspectionDetailsDialog] Received socket update confirmation:', response);
            
            // Remove this listener to prevent memory leaks
            socket.off('quality:inspection:updated', handleUpdateConfirmation);
            
            // Check if there was an error
            if (response.error) {
              toast({
                id: toastId,
                title: "Error",
                description: response.details || response.message || "Failed to update inspection",
                variant: "destructive",
              });
            } else {
              // Success via socket
              toast({
                id: toastId,
                title: "Success",
                description: "Inspection details have been updated successfully (via WebSocket)",
              });
              
              // Close the dialog
              onOpenChange(false);
            }
          };
          
          // Listen for update confirmation
          socket.on('quality:inspection:updated', handleUpdateConfirmation);
          
          // Emit the update event
          socket.emit('quality:inspection:update', {
            id: updatedInspection.id,
            updates: updatedInspection
          });
          
          // Set a timeout for the socket response
          const timeoutId = setTimeout(() => {
            socket.off('quality:inspection:updated', handleUpdateConfirmation);
            
            toast({
              id: toastId,
              title: "Warning",
              description: "The server may not have confirmed the update, but we'll try to continue.",
              variant: "destructive",
            });
            
            // Fall back to using the current state
            onUpdate(updatedInspection);
            onOpenChange(false);
          }, 15000); // 15 second timeout is longer than the client timeout
          
          // Store the timeout ID cleanup
          return () => clearTimeout(timeoutId);
        } catch (socketError) {
          console.error('Socket update also failed:', socketError);
          throw socketError;
        }
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

  const socket = useWebSocket({ namespace: 'manufacturing' });

  // Fetch projects for project selection
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    enabled: open,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Final QC Inspection</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ID: {inspection.id}</span>
              <span>•</span>
              <span>Type: {inspection.templateType || inspection.type}</span>
              <span>•</span>
              <Badge>{inspection.status}</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={currentInspection.projectId || ""}
                    onValueChange={(value) => {
                      const selectedProject = projects.find(p => p.id === value);
                      setCurrentInspection(prev => ({
                        ...prev,
                        projectId: value,
                        projectNumber: selectedProject?.projectNumber || prev.projectNumber,
                        location: selectedProject?.location || prev.location,
                      }));
                      if (selectedProject?.projectNumber) {
                        updateLinkedNCRs(selectedProject.projectNumber);
                      }
                    }}
                  >
                    <SelectTrigger>
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

                <div>
                  <label className="text-sm font-medium">Project Number</label>
                  <Input
                    type="text"
                    value={currentInspection.projectNumber || ""}
                    onChange={(e) => handleProjectNumberChange(e.target.value)}
                    placeholder="Enter project number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    type="text"
                    value={currentInspection.location || ""}
                    onChange={(e) => setCurrentInspection(prev => ({
                      ...prev,
                      location: e.target.value
                    }))}
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Inspector</label>
                  <Input
                    type="text"
                    value={currentInspection.inspector || ""}
                    onChange={(e) => setCurrentInspection(prev => ({
                      ...prev,
                      inspector: e.target.value
                    }))}
                    placeholder="Inspector name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Only render checklist items if they exist */}
              {(currentInspection.results.checklistItems || []).length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Checklist Items</h4>
                  {(currentInspection.results.checklistItems || []).map((item) => (
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
                </div>
              )}

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

                <h4 className="font-medium">
                  {isEditing ? `Edit Defect (ID: ${editingDefectId})` : "Defects Found"}
                </h4>
                <div id="defect-form" className="grid grid-cols-2 gap-3 mb-3">
                  {/* Description - full width */}
                  <div className="col-span-2">
                    <Input
                      placeholder="Enter defect description"
                      value={newDefect.description}
                      onChange={(e) => setNewDefect(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  {/* Severity dropdown */}
                  <div>
                    <div className="flex items-center text-sm mb-1">
                      <FontAwesomeIcon icon={faSpinner} className="mr-1 h-3 w-3" />
                      <span>Severity</span>
                    </div>
                    <Select
                      value={newDefect.severity}
                      onValueChange={(value) => 
                        setNewDefect(prev => ({ 
                          ...prev, 
                          severity: value as "minor" | "major" | "critical" 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Location input */}
                  <div>
                    <div className="flex items-center text-sm mb-1">
                      <FontAwesomeIcon icon={faLocationDot} className="mr-1 h-3 w-3" />
                      <span>Location</span>
                    </div>
                    <Input
                      placeholder="Specify location of defect"
                      value={newDefect.location}
                      onChange={(e) => setNewDefect(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  
                  {/* Assigned To input */}
                  <div>
                    <div className="flex items-center text-sm mb-1">
                      <FontAwesomeIcon icon={faUserTag} className="mr-1 h-3 w-3" />
                      <span>Assigned To</span>
                    </div>
                    <Input
                      placeholder="Person responsible for fixing"
                      value={newDefect.assignedTo}
                      onChange={(e) => setNewDefect(prev => ({ ...prev, assignedTo: e.target.value }))}
                    />
                  </div>
                  
                  {/* Defect Photos */}
                  <div className="col-span-2">
                    <div className="flex items-center text-sm mb-1">
                      <FontAwesomeIcon icon={faCamera} className="mr-1 h-3 w-3" />
                      <span>Defect Photos</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleDefectPhotoUpload}
                        disabled={uploadingDefectPhoto}
                      />
                      {uploadingDefectPhoto && (
                        <div className="animate-spin">
                          <FontAwesomeIcon icon={faSpinner} className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    
                    {/* Display thumbnails of uploaded photos */}
                    {newDefect.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newDefect.photos.map((photoUrlWithId, index) => {
                          // Extract display URL without the ID
                          const photoUrl = photoUrlWithId.split('#')[0];
                          
                          return (
                            <div key={index} className="relative w-16 h-16 border rounded overflow-hidden">
                              <img src={photoUrl} alt={`Defect photo ${index + 1}`} className="w-full h-full object-cover" />
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center"
                                onClick={() => handleDeleteDefectPhoto(photoUrlWithId)}
                              >
                                <FontAwesomeIcon icon={faTimes} className="h-2 w-2" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Button row */}
                  <div className="col-span-2 mt-4 flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                          Cancel Edit
                        </Button>
                        <Button onClick={handleAddDefect} className="flex-1">
                          <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                          Update Defect
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAddDefect} className="w-full">
                        <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                        Add Defect
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {currentInspection.results.defectsFound.map((defect) => (
                    <div key={defect.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              defect.severity === "critical" ? "destructive" :
                              defect.severity === "major" ? "default" : "secondary"
                            }>
                              {defect.severity}
                            </Badge>
                            <span className="font-medium">{defect.description}</span>
                          </div>
                          
                          {/* Additional details */}
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            {defect.location && (
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                <span>Location: {defect.location}</span>
                              </div>
                            )}
                            
                            {defect.assignedTo && (
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faUserTag} className="h-3 w-3" />
                                <span>Assigned: {defect.assignedTo}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Photos gallery */}
                          {defect.photos && defect.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {defect.photos.map((photoUrlWithId, index) => {
                                // Extract display URL without the ID for display
                                const photoUrl = photoUrlWithId.includes('#') ? 
                                  photoUrlWithId.split('#')[0] : photoUrlWithId;
                                
                                return (
                                  <div key={index} className="relative w-16 h-16 border rounded overflow-hidden">
                                    <img
                                      src={photoUrl}
                                      alt={`Defect photo ${index + 1}`}
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() => window.open(photoUrl, '_blank')}
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteExistingDefectPhoto(photoUrlWithId, defect.id);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTimes} className="h-2 w-2" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Add photo to existing defect */}
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                id={`defect-photo-upload-${defect.id}`}
                                className="w-auto flex-1"
                                onChange={(e) => handleExistingDefectPhotoUpload(e, defect.id)}
                                disabled={uploadingDefectPhoto}
                              />
                              {uploadingDefectPhoto && (
                                <div className="animate-spin">
                                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleStartEditDefect(defect.id)}>
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveDefect(defect.id)}>
                            <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
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