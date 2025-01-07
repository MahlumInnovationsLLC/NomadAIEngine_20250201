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
import { 
  Dumbbell, 
  Bike, 
  Timer, 
  Footprints, 
  Heart, 
  Activity,
  Waves,
  Weight,
  Target,
  MonitorSmartphone,
  LucideIcon,
  type LucideProps
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IconSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  equipmentType: string;
  onSelectIcon: (iconKey: string) => void;
}

interface IconSuggestion {
  icon: LucideIcon;
  key: string;
  reason: string;
  confidence: number;
}

const defaultIcons: Record<string, LucideIcon> = {
  "dumbbell": Dumbbell,
  "bike": Bike,
  "timer": Timer,
  "footprints": Footprints,
  "heart": Heart,
  "activity": Activity,
  "waves": Waves,
  "weight": Weight,
  "target": Target,
  "monitor": MonitorSmartphone
};

export function IconSuggestionDialog({ 
  open, 
  onOpenChange, 
  equipmentName,
  equipmentType,
  onSelectIcon 
}: IconSuggestionDialogProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['/api/equipment/suggest-icons', equipmentName, equipmentType],
    enabled: open,
    select: (data): IconSuggestion[] => {
      return data.map((suggestion: any) => ({
        ...suggestion,
        icon: defaultIcons[suggestion.key] || Dumbbell
      }));
    }
  });

  const handleSelectIcon = (iconKey: string) => {
    setSelectedIcon(iconKey);
  };

  const handleConfirm = () => {
    if (selectedIcon) {
      onSelectIcon(selectedIcon);
      onOpenChange(false);
    }
  };

  const renderIcon = (Icon: LucideIcon, props?: LucideProps) => {
    return <Icon {...props} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Suggested Icons</DialogTitle>
          <DialogDescription>
            Based on the equipment type "{equipmentType}" and name "{equipmentName}", 
            here are some suggested icons that might be appropriate.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-2 text-center py-8">
                Analyzing equipment and generating suggestions...
              </div>
            ) : suggestions.map((suggestion: IconSuggestion) => (
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
                    {renderIcon(suggestion.icon, { className: "w-6 h-6" })}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {suggestion.key}
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