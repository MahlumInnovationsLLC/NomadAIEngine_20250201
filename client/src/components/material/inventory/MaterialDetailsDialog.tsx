import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { Material } from "@/types/material";

interface MaterialDetailsDialogProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialDetailsDialog({
  material,
  open,
  onOpenChange,
}: MaterialDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon="box" className="h-5 w-5" />
            Material Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{material.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{material.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{material.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subcategory:</span>
                  <span className="font-medium">{material.subcategory || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit:</span>
                  <span className="font-medium">{material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span className="font-medium">${material.unitPrice.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Stock Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-medium">{material.currentStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allocated Stock:</span>
                  <span className="font-medium">{material.allocatedStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Stock:</span>
                  <span className="font-medium">{material.availableStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Stock:</span>
                  <span className="font-medium">{material.minimumStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reorder Point:</span>
                  <span className="font-medium">{material.reorderPoint} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Time:</span>
                  <span className="font-medium">{material.leadTime} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier Name:</span>
                    <span className="font-medium">{material.supplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier Code:</span>
                    <span className="font-medium">{material.supplier.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Name:</span>
                    <span className="font-medium">{material.supplier.contact.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Email:</span>
                    <span className="font-medium">{material.supplier.contact.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <span className="font-medium">{material.supplier.contact.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier Rating:</span>
                    <Badge variant={material.supplier.rating >= 4 ? "success" : "warning"}>
                      {material.supplier.rating} / 5
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
