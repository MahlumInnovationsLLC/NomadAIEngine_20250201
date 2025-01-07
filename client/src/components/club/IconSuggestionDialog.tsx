import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { cn } from "@/lib/utils";

interface IconSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  equipmentType: string;
  onSelectIcon: (iconKey: string) => void;
}

interface IconSuggestion {
  key: string;
  prefix: string;
  icon: string;
  reason: string;
  confidence: number;
}

// Predefined Font Awesome icons for fitness equipment
const defaultIcons: IconSuggestion[] = [
  {
    key: "dumbbell",
    prefix: "fas",
    icon: "dumbbell",
    reason: "Perfect for strength training equipment",
    confidence: 0.95
  },
  {
    key: "running",
    prefix: "fas",
    icon: "person-running",
    reason: "Ideal for cardio and running equipment",
    confidence: 0.9
  },
  {
    key: "bicycle",
    prefix: "fas",
    icon: "bicycle",
    reason: "Best for cycling equipment",
    confidence: 0.9
  },
  {
    key: "heart-pulse",
    prefix: "fas",
    icon: "heart-pulse",
    reason: "Good for cardio monitoring equipment",
    confidence: 0.85
  },
  {
    key: "weight-scale",
    prefix: "fas",
    icon: "weight-scale",
    reason: "Suitable for weight measurement equipment",
    confidence: 0.85
  },
  {
    key: "stairs",
    prefix: "fas",
    icon: "stairs",
    reason: "Perfect for stair climbers and steppers",
    confidence: 0.8
  },
  {
    key: "gauge",
    prefix: "fas",
    icon: "gauge-high",
    reason: "Good for equipment with performance metrics",
    confidence: 0.8
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

  const handleSelectIcon = (iconKey: string) => {
    setSelectedIcon(iconKey);
  };

  const handleConfirm = () => {
    if (selectedIcon) {
      onSelectIcon(selectedIcon);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Equipment Icon</DialogTitle>
          <DialogDescription>
            Choose an icon that best represents "{equipmentName}" ({equipmentType})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4">
            {defaultIcons.map((suggestion) => (
              <div
                key={suggestion.key}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedIcon === suggestion.key 
                    ? "border-primary bg-primary/10" 
                    : "hover:bg-accent"
                )}
                onClick={() => handleSelectIcon(suggestion.key)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background">
                    <i className={`${suggestion.prefix} fa-${suggestion.icon} fa-lg`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {suggestion.key.replace('-', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(suggestion.confidence * 100)}% match
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {suggestion.reason}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

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