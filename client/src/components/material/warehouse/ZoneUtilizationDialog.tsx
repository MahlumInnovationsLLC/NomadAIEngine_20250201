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
import { useToast } from "@/hooks/use-toast";

interface ZoneUtilizationDialogProps {
  zone: WarehouseZone;
  onUpdate: (updates: Partial<WarehouseZone>) => void;
}

export function ZoneUtilizationDialog({ zone, onUpdate }: ZoneUtilizationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [utilization, setUtilization] = useState(zone.currentUtilization.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newUtilization = parseInt(utilization);
      if (isNaN(newUtilization) || newUtilization < 0 || newUtilization > zone.capacity) {
        toast({
          title: "Invalid Input",
          description: `Utilization must be between 0 and ${zone.capacity}`,
          variant: "destructive",
        });
        return;
      }

      await onUpdate({
        currentUtilization: newUtilization,
        utilizationPercentage: Math.round((newUtilization / zone.capacity) * 100)
      });

      toast({
        title: "Zone Updated",
        description: "Zone utilization has been successfully updated.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update zone utilization:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update zone utilization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUtilizationColor = (value: number) => {
    const percentage = (value / zone.capacity) * 100;
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-yellow-500";
    return "text-green-500";
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
                className={getUtilizationColor(parseInt(utilization) || 0)}
              />
              <span className="text-sm text-muted-foreground">
                / {zone.capacity.toLocaleString()} sq ft
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-grow bg-secondary h-2 rounded-full">
                <div
                  className={`h-full rounded-full ${getUtilizationColor(parseInt(utilization) || 0)}`}
                  style={{ width: `${((parseInt(utilization) || 0) / zone.capacity) * 100}%` }}
                />
              </div>
              <span className="text-sm">
                {Math.round(((parseInt(utilization) || 0) / zone.capacity) * 100)}%
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