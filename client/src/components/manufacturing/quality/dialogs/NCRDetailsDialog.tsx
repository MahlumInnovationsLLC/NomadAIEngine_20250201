import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NonConformanceReport } from "@/types/manufacturing";

interface NCRDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ncr: NonConformanceReport;
}

export function NCRDetailsDialog({ open, onOpenChange, ncr }: NCRDetailsDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{ncr.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>NCR #{ncr.number}</span>
            <span>•</span>
            <span>Created: {formatDate(ncr.createdAt)}</span>
            <span>•</span>
            <Badge>{ncr.status.replace('_', ' ')}</Badge>
          </div>
        </DialogHeader>

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

        <div className="flex justify-end gap-2 pt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
