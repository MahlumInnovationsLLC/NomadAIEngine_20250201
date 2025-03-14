import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, 
  faCheck, 
  faArrowRotateLeft, 
  faClipboardList, 
  faCheckCircle,
  faSpinner,
  faCommentDots
} from '@fortawesome/pro-light-svg-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getValidTransitions } from "../utils/milestoneUtils";
import { NCR } from "@/types/manufacturing/ncr";
import { MRB } from "@/types/manufacturing/mrb";
import { CAPA } from "@/types/manufacturing/capa";
import { useToast } from "@/hooks/use-toast";

// Interface for status transitions
export interface StatusTransition {
  from: string; 
  to: string; 
  label: string; 
  icon?: string; 
  color?: string; 
  reasons?: string[];
  requiresComment?: boolean;
  requiresApproval?: boolean;
}

interface StatusTransitionControlsProps {
  item: NCR | MRB | CAPA;
  itemType: 'ncr' | 'mrb' | 'capa';
  onStatusUpdate: (newStatus: string, comment: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg';
  onSuccess?: () => void;
}

export function StatusTransitionControls({
  item,
  itemType,
  onStatusUpdate,
  disabled = false,
  className = '',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  onSuccess
}: StatusTransitionControlsProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [statusUpdateComment, setStatusUpdateComment] = useState('');
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null);
  const { toast } = useToast();

  // Helper function to get the appropriate icon for a transition
  const getTransitionIcon = (transitionLabel: string) => {
    const label = transitionLabel.toLowerCase();
    if (label.includes('approve')) return faCheck;
    if (label.includes('reject') || label.includes('return')) return faArrowRotateLeft;
    if (label.includes('submit') || label.includes('start')) return faPlay;
    if (label.includes('review')) return faClipboardList;
    return faCheckCircle;
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedTransition) return;
    
    try {
      setIsUpdatingStatus(true);
      await onStatusUpdate(selectedTransition.to, statusUpdateComment);
      
      toast({
        title: "Status Updated",
        description: `Status changed to ${selectedTransition.to.replace('_', ' ')}`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
      setShowStatusUpdateDialog(false);
      setStatusUpdateComment('');
      setSelectedTransition(null);
    }
  };

  const currentStatus = (item as any).status || '';
  const availableTransitions = getValidTransitions(currentStatus, itemType);
  
  return (
    <>
      <div className={`space-x-2 ${className}`}>
        {availableTransitions.map((transition, index) => (
          <Button 
            key={index}
            variant={buttonVariant}
            size={buttonSize}
            disabled={disabled}
            onClick={() => {
              setSelectedTransition(transition);
              setShowStatusUpdateDialog(true);
            }}
          >
            <FontAwesomeIcon 
              icon={getTransitionIcon(transition.label)}
              className="mr-2 h-4 w-4"
            />
            {transition.label}
          </Button>
        ))}
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdateDialog} onOpenChange={setShowStatusUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change status to <span className="font-medium capitalize">{selectedTransition?.to.replace('_', ' ')}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {selectedTransition?.requiresComment 
                  ? 'Comment (required)' 
                  : 'Add a comment (optional)'}
              </Label>
              <Textarea
                id="comment"
                value={statusUpdateComment}
                onChange={(e) => setStatusUpdateComment(e.target.value)}
                placeholder="Enter additional notes about this status update"
                className="min-h-[100px]"
                required={selectedTransition?.requiresComment}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              disabled={isUpdatingStatus || (selectedTransition?.requiresComment && !statusUpdateComment.trim())}
              onClick={handleStatusUpdate}
            >
              {isUpdatingStatus ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCommentDots} className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}