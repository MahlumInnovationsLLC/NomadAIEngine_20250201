import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { WarehouseZone } from "@/types/material";

interface ZoneUtilizationDialogProps {
  zone: WarehouseZone;
  onUpdate: (updates: Partial<WarehouseZone>) => void;
}

export function ZoneUtilizationDialog({ zone, onUpdate }: ZoneUtilizationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [utilization, setUtilization] = useState(zone.currentUtilization.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newUtilization = parseInt(utilization);
      if (isNaN(newUtilization) || newUtilization < 0 || newUtilization > zone.capacity) {
        throw new Error(`Utilization must be between 0 and ${zone.capacity}`);
      }

      await onUpdate({
        currentUtilization: newUtilization,
        utilizationPercentage: Math.round((newUtilization / zone.capacity) * 100)
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update zone utilization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FontAwesomeIcon icon="chart-line" className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Zone Utilization - {zone.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="utilization">Current Utilization (sq ft)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="utilization"
                type="number"
                value={utilization}
                onChange={(e) => setUtilization(e.target.value)}
                min={0}
                max={zone.capacity}
                required
              />
              <span className="text-sm text-muted-foreground">
                / {zone.capacity.toLocaleString()} sq ft
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Current utilization: {zone.utilizationPercentage}%
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <FontAwesomeIcon icon="spinner" className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
