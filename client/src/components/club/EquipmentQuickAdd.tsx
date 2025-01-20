import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@db/schema";

interface EquipmentQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentAdded?: (equipment: Equipment) => void;
}

const equipmentPresets = [
  {
    id: "treadmill",
    name: "Treadmill",
    icon: "dumbbell",
    description: "Commercial grade treadmill with speed and incline control",
    type: {
      name: "Treadmill",
      manufacturer: "Life Fitness",
      model: "95T Elevation Series",
      category: "cardio",
      connectivityType: "bluetooth",
    }
  },
  {
    id: "elliptical",
    name: "Elliptical",
    icon: "dumbbell",
    description: "Cross trainer with adjustable resistance and programs",
    type: {
      name: "Elliptical",
      manufacturer: "Precor",
      model: "EFX 885",
      category: "cardio",
      connectivityType: "bluetooth",
    }
  },
  {
    id: "bike",
    name: "Exercise Bike",
    icon: "dumbbell",
    description: "Upright stationary bike with digital display",
    type: {
      name: "Exercise Bike",
      manufacturer: "Schwinn",
      model: "AC Performance Plus",
      category: "cardio",
      connectivityType: "ant",
    }
  },
  {
    id: "rower",
    name: "Rowing Machine",
    icon: "dumbbell",
    description: "Air-resistance rowing machine with performance monitor",
    type: {
      name: "Rower",
      manufacturer: "Concept2",
      model: "Model D",
      category: "cardio",
      connectivityType: "bluetooth",
    }
  },
  {
    id: "stairmaster",
    name: "StairMaster",
    icon: "dumbbell",
    description: "Step climbing machine with varied programs",
    type: {
      name: "StairMaster",
      manufacturer: "StairMaster",
      model: "Gauntlet 8G",
      category: "cardio",
      connectivityType: "wifi",
    }
  }
];

export function EquipmentQuickAdd({ open, onOpenChange, onEquipmentAdded }: EquipmentQuickAddProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addEquipmentMutation = useMutation({
    mutationFn: async (preset: typeof equipmentPresets[number]) => {
      // First create the equipment type if it doesn't exist
      const typeResponse = await fetch("/api/equipment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset.type),
      });

      if (!typeResponse.ok) {
        throw new Error("Failed to create equipment type");
      }

      const equipmentType = await typeResponse.json();

      // Then create the equipment with the new type
      const equipmentResponse = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${preset.name} #1`,
          equipmentTypeId: equipmentType.id,
          status: "active",
          healthScore: 100,
          deviceConnectionStatus: "disconnected",
        }),
      });

      if (!equipmentResponse.ok) {
        throw new Error("Failed to create equipment");
      }

      return equipmentResponse.json();
    },
    onSuccess: (newEquipment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      onOpenChange(false);
      if (onEquipmentAdded) {
        onEquipmentAdded(newEquipment);
      }
      toast({
        title: "Equipment Added",
        description: "New equipment has been successfully added.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Quick Add Equipment</DialogTitle>
          <DialogDescription>
            Select a preset to quickly add common gym equipment
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {equipmentPresets.map((preset) => (
            <Card
              key={preset.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => addEquipmentMutation.mutate(preset)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {preset.name}
                </CardTitle>
                <FontAwesomeIcon icon={preset.icon} className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{preset.description}</CardDescription>
                <div className="mt-2 text-xs text-muted-foreground">
                  {preset.type.manufacturer} - {preset.type.model}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}