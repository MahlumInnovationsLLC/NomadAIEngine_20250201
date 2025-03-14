import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NCR } from "@/types/manufacturing/ncr";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useToast } from "@/hooks/use-toast";
import { 
  faEdit, 
  faTrash,
  faPlus
} from '@fortawesome/pro-light-svg-icons';
import { NCRAttachmentGallery } from "../common/NCRAttachmentGallery";
import { EnhancedMilestoneTracker } from "../common/EnhancedMilestoneTracker";
import { StatusTransitionControls } from "../common/StatusTransitionControls";
import { AttachmentUploader } from "../common/AttachmentUploader";

interface NCRDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ncr: NCR;
  onSuccess?: () => void;
}

export function NCRDetailsDialog({ open, onOpenChange, ncr, onSuccess }: NCRDetailsDialogProps) {
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'major':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Refresh NCRs when needed
  const refreshNCRs = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
  };
  
  // Status update functionality
  const handleStatusUpdate = async (nextStatus: string, comment: string = '') => {
    try {
      const response = await fetch(`/api/manufacturing/quality/ncrs/${ncr.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStatus,
          comment
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update NCR status');
      }
      
      refreshNCRs();
      
      if (onSuccess) {
        onSuccess();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating status:', error);
      return Promise.reject(error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      setDeletingAttachment(attachmentId);
      console.log('Attempting to delete attachment:', attachmentId);

      const response = await fetch(
        `/api/manufacturing/quality/ncrs/${ncr.id}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Delete attachment error response:', data);
        throw new Error(data.message || data.details || 'Failed to delete attachment');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });

      toast({
        title: "Success",
        description: "Attachment removed successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete attachment",
        variant: "destructive",
      });
    } finally {
      setDeletingAttachment(null);
    }
  };
  
  const handleUploadSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
    setShowAttachmentUploader(false);
    toast({
      title: "Success",
      description: "Attachment(s) uploaded successfully",
    });
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-none">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold">{ncr.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>NCR #{ncr.number}</span>
                  <span>•</span>
                  <span>Created: {formatDate(ncr.createdAt)}</span>
                  <span>•</span>
                  <Badge>{ncr.status?.replace('_', ' ') || ncr.status}</Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Close this dialog and open in edit mode
                  onOpenChange(false);
                  if (onSuccess) onSuccess();
                }}
              >
                <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                Edit NCR
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1">Type</h4>
                          <p className="text-muted-foreground capitalize">{ncr.type}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Severity</h4>
                          <Badge variant={getSeverityColor(ncr.severity)}>{ncr.severity}</Badge>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Area</h4>
                          <p className="text-muted-foreground">{ncr.area}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Product Line</h4>
                          <p className="text-muted-foreground">{'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Lot Number</h4>
                          <p className="text-muted-foreground">{ncr.lotNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Quantity Affected</h4>
                          <p className="text-muted-foreground">{ncr.quantityAffected || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:col-span-1">
                  <EnhancedMilestoneTracker 
                    item={ncr}
                    type="ncr"
                    showLabels={false}
                    showBlinker
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{ncr.description}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Disposition</h3>
                {ncr.disposition?.decision ? (
                  <Badge variant="outline" className="capitalize">
                    {ncr.disposition.decision.replace('_', ' ')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="capitalize">
                    Pending
                  </Badge>
                )}
                {ncr.disposition?.justification && (
                  <div>
                    <h4 className="font-medium mb-1">Justification</h4>
                    <p className="text-muted-foreground">{ncr.disposition.justification}</p>
                  </div>
                )}
                {ncr.disposition?.conditions && (
                  <div>
                    <h4 className="font-medium mb-1">Conditions</h4>
                    <p className="text-muted-foreground">{ncr.disposition.conditions}</p>
                  </div>
                )}
                {ncr.disposition?.approvedBy && ncr.disposition.approvedBy.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">Approvals</h4>
                    <div className="space-y-2">
                      {ncr.disposition.approvedBy.map((approval, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{approval.approver}</span>
                          <span className="text-muted-foreground"> - {new Date(approval.date).toLocaleDateString()}</span>
                          {approval.comment && (
                            <p className="text-muted-foreground ml-4">{approval.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {ncr.containmentActions && Array.isArray(ncr.containmentActions) && ncr.containmentActions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Containment Actions</h3>
                  <div className="space-y-4">
                    {ncr.containmentActions.map((action, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3">
                              <h4 className="font-medium mb-1">Action</h4>
                              <p className="text-muted-foreground">{action.action}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Assigned To</h4>
                              <p className="text-muted-foreground">{action.assignedTo}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Due Date</h4>
                              <p className="text-muted-foreground">{action.dueDate}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Documentation and Evidence</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAttachmentUploader(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                    Add Attachment
                  </Button>
                </div>
                
                {showAttachmentUploader ? (
                  <Card>
                    <CardContent className="pt-6">
                      <AttachmentUploader 
                        parentId={ncr.id}
                        parentType="ncr"
                        onSuccess={handleUploadSuccess}
                        onCancel={() => setShowAttachmentUploader(false)}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <NCRAttachmentGallery 
                    attachments={ncr.attachments || []}
                    onDeleteAttachment={handleDeleteAttachment}
                    readonly={false}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-6 flex-none border-t mt-6">
            <StatusTransitionControls
              item={ncr}
              itemType="ncr"
              onStatusUpdate={handleStatusUpdate}
              buttonVariant="outline"
              buttonSize="sm"
              onSuccess={refreshNCRs}
            />
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}