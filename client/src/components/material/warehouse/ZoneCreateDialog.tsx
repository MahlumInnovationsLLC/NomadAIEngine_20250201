import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { WarehouseZone } from "@/types/material";

interface ZoneCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (zoneData: Omit<WarehouseZone, 'id'>) => void;
  warehouseId: string;
  warehouseCapacity: number;
}

export function ZoneCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  warehouseId,
  warehouseCapacity = 0,
}: ZoneCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'storage' as WarehouseZone['type'],
    capacity: 0,
    currentUtilization: 0,
    status: 'active' as WarehouseZone['status'],
    pickingStrategy: 'FIFO' as WarehouseZone['pickingStrategy'],
    allowsCrossDocking: false,
    warehouseId: warehouseId,
    utilizationPercentage: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      console.error('No warehouse ID provided');
      return;
    }

    setIsSubmitting(true);

    try {
      if (formData.capacity > warehouseCapacity) {
        throw new Error('Zone capacity cannot exceed warehouse capacity');
      }

      await onSubmit({
        ...formData,
        utilizationPercentage: Math.round((formData.currentUtilization / formData.capacity) * 100),
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create zone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Zone</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Zone Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: WarehouseZone['type']) =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="picking">Picking</SelectItem>
                <SelectItem value="receiving">Receiving</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (sq ft)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
              required
              min={0}
              max={warehouseCapacity}
            />
            <p className={cn(
              "text-sm",
              warehouseCapacity <= 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {warehouseCapacity > 0 
                ? `Available warehouse capacity: ${warehouseCapacity.toLocaleString()} sq ft`
                : "Error: No available warehouse capacity"
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickingStrategy">Picking Strategy</Label>
            <Select
              value={formData.pickingStrategy}
              onValueChange={(value: WarehouseZone['pickingStrategy']) =>
                setFormData(prev => ({ ...prev, pickingStrategy: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">First In, First Out</SelectItem>
                <SelectItem value="LIFO">Last In, First Out</SelectItem>
                <SelectItem value="FEFO">First Expired, First Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || warehouseCapacity <= 0}>
              {isSubmitting ? (
                <FontAwesomeIcon icon="spinner" className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Zone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}