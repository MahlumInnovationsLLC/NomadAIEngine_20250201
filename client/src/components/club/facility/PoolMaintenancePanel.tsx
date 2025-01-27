import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { ChemicalReading, PoolMaintenance } from "@/types/facility";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PoolMaintenancePanelProps {
  maintenance: PoolMaintenance | undefined;
}

export default function PoolMaintenancePanel({ maintenance }: PoolMaintenancePanelProps) {
  const [showReadingDialog, setShowReadingDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addReadingMutation = useMutation({
    mutationFn: async (reading: ChemicalReading) => {
      const response = await fetch("/api/facility/pool/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      });

      if (!response.ok) {
        throw new Error("Failed to add reading");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facility/pool/latest"] });
      setShowReadingDialog(false);
      toast({
        title: "Reading Added",
        description: "Pool chemical reading has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case "chlorine":
        return value >= 1 && value <= 3 ? "text-green-500" : "text-red-500";
      case "pH":
        return value >= 7.2 && value <= 7.8 ? "text-green-500" : "text-red-500";
      case "alkalinity":
        return value >= 80 && value <= 120 ? "text-green-500" : "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleAddReading = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const reading: ChemicalReading = {
      type: formData.get("type") as string,
      value: Number(formData.get("value")),
      unit: formData.get("unit") as string,
      timestamp: new Date().toISOString(),
      recordedBy: "Staff", // TODO: Replace with actual user
    };

    addReadingMutation.mutate(reading);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pool Maintenance</h3>
        <Button onClick={() => setShowReadingDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Add Reading
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Chemical Levels Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Chemical Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Chlorine</span>
                <span className={getStatusColor(maintenance?.chemicalLevels.chlorine || 0, "chlorine")}>
                  {maintenance?.chemicalLevels.chlorine || 0} ppm
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>pH Level</span>
                <span className={getStatusColor(maintenance?.chemicalLevels.pH || 0, "pH")}>
                  {maintenance?.chemicalLevels.pH || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Alkalinity</span>
                <span className={getStatusColor(maintenance?.chemicalLevels.alkalinity || 0, "alkalinity")}>
                  {maintenance?.chemicalLevels.alkalinity || 0} ppm
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Calcium Hardness</span>
                <span>{maintenance?.chemicalLevels.calcium || 0} ppm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Last Cleaning</span>
                <span>{maintenance?.lastCleaning
                  ? new Date(maintenance.lastCleaning).toLocaleDateString()
                  : "Not recorded"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Next Cleaning</span>
                <span>{maintenance?.nextCleaning
                  ? new Date(maintenance.nextCleaning).toLocaleDateString()
                  : "Not scheduled"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Filter Status</span>
                <span className="capitalize">{maintenance?.filterStatus || "Unknown"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Reading Dialog */}
      <Dialog open={showReadingDialog} onOpenChange={setShowReadingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Chemical Reading</DialogTitle>
            <DialogDescription>
              Record a new chemical reading for the pool
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddReading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Chemical Type</Label>
              <select
                id="type"
                name="type"
                className="w-full border rounded-md p-2"
                required
              >
                <option value="chlorine">Chlorine</option>
                <option value="pH">pH</option>
                <option value="alkalinity">Alkalinity</option>
                <option value="calcium">Calcium</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                name="unit"
                className="w-full border rounded-md p-2"
                required
              >
                <option value="ppm">PPM</option>
                <option value="pH">pH</option>
              </select>
            </div>

            <Button type="submit" className="w-full">
              Save Reading
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
