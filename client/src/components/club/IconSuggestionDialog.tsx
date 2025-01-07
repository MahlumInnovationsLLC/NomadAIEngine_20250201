import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface IconSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  equipmentType: string;
  onSelectIcon: (iconKey: string) => void;
}

// Custom fitness equipment icons from the kit
const fitnessIcons = [
  { 
    name: '10250144-stationary-bike-sports-competition-fitness-icon', 
    label: 'Stationary Bike'
  },
  { 
    name: '4596226-fitness-gym-machine-stationery-rowing-workout-icon', 
    label: 'Rowing Machine'
  },
  { 
    name: '4596227-bicycle-bike-cardio-fitness-gym-icon', 
    label: 'Exercise Bike'
  },
  { 
    name: '4596236-cable-crossover-equipment-gym-machine-tool-icon', 
    label: 'Cable Crossover'
  },
  { 
    name: '4596246-cable-row-equipment-gym-machine-tool-icon', 
    label: 'Cable Row'
  },
  { 
    name: '4596247-equipment-gym-lat-pulldown-machine-tool-icon', 
    label: 'Lat Pulldown'
  },
  { 
    name: '4596250-equipment-gym-hammer-strength-machine-tool-icon', 
    label: 'Hammer Strength'
  },
  { 
    name: '4596255-equipment-gym-smith-machine-tool-icon', 
    label: 'Smith Machine'
  },
  { 
    name: '6258926-fitness-service-gym-equipment-gym-services-jogging-machine-runner-icon', 
    label: 'Treadmill'
  },
  { 
    name: '805744-cardio-elliptical-exercise-fitness-training-equipment-icon', 
    label: 'Elliptical'
  },
  { 
    name: '8665879-stairs-staircase-icon', 
    label: 'StairMaster'
  },
  // Connectivity Icons
  { 
    name: 'wifi', 
    label: 'WiFi Connected',
    type: 'solid',
    category: 'connectivity' 
  },
  { 
    name: 'bluetooth', 
    label: 'Bluetooth',
    type: 'solid',
    category: 'connectivity' 
  }
];

export function IconSuggestionDialog({ 
  open, 
  onOpenChange, 
  equipmentName,
  equipmentType,
  onSelectIcon 
}: IconSuggestionDialogProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectIcon = (iconKey: string) => {
    setSelectedIcon(iconKey);
  };

  const handleConfirm = () => {
    if (selectedIcon) {
      onSelectIcon(selectedIcon);
      onOpenChange(false);
    }
  };

  const filteredIcons = fitnessIcons.filter(icon => 
    (icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Equipment Icon</DialogTitle>
          <DialogDescription>
            Choose an icon that best represents "{equipmentName}" ({equipmentType})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredIcons.map((icon) => (
                <div
                  key={icon.name}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedIcon === icon.name
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent"
                  )}
                  onClick={() => handleSelectIcon(icon.name)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-md bg-background">
                      <FontAwesomeIcon 
                        iconName={icon.name}
                        type={icon.type || 'kit'}
                        size="lg"
                      />
                    </div>
                    <div className="text-sm font-medium text-center">
                      {icon.label}
                    </div>
                    {icon.category === 'connectivity' && (
                      <Badge variant="secondary" className="text-xs">
                        Connectivity
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedIcon}
          >
            Apply Selected Icon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}