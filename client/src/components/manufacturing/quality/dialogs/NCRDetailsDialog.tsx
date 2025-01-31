import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NonConformanceReport } from "@/types/manufacturing";
import { NCRDialog } from "./NCRDialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface NCRDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ncr: NonConformanceReport;
}

export function NCRDetailsDialog({ open, onOpenChange, ncr }: NCRDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

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

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
    setShowEditDialog(false);
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
                  <Badge>{ncr.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEditDialog(true)}
              >
                <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                Edit NCR
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="space-y-6">
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
                      <p className="text-muted-foreground">{ncr.productLine || 'N/A'}</p>
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{ncr.description}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Disposition</h3>
                <Badge variant="outline" className="capitalize">
                  {ncr.disposition.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Containment Actions</h3>
                <div className="space-y-4">
                  {ncr.containmentActions.map((action, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-3">
                            <h4 className="font-medium mb-1">Action</h4>
                            <p className="text-muted-foreground">{action.action || 'No action specified'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Assigned To</h4>
                            <p className="text-muted-foreground">{action.assignedTo || 'Unassigned'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Due Date</h4>
                            <p className="text-muted-foreground">{action.dueDate || 'No date set'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6 flex-none border-t mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <NCRDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          defaultValues={ncr}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}