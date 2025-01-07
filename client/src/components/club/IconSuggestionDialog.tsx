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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { cn } from "@/lib/utils";

interface IconSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  equipmentType: string;
  onSelectIcon: (iconKey: string) => void;
}

interface IconSuggestion {
  icon: string;
  type: 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands';
  key: string;
  reason: string;
  confidence: number;
}

// Extended set of Font Awesome fitness equipment icons
const defaultIcons: Record<string, { icon: string; type: 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands' }> = {
  "dumbbell": { icon: "dumbbell", type: "solid" },
  "running": { icon: "person-running", type: "solid" },
  "bicycle": { icon: "bicycle", type: "solid" },
  "heartbeat": { icon: "heartbeat", type: "solid" },
  "swimmer": { icon: "person-swimming", type: "solid" },
  "weight": { icon: "weight-hanging", type: "solid" },
  "yoga": { icon: "person-yoga", type: "solid" },
  "walking": { icon: "person-walking", type: "solid" },
  "stairs": { icon: "stairs", type: "solid" },
  "gauge": { icon: "gauge-high", type: "solid" },
  "boxing": { icon: "hand-fist", type: "solid" },
  "hiking": { icon: "person-hiking", type: "solid" },
  "jumping": { icon: "person-falling", type: "solid" },
  "skating": { icon: "person-skating", type: "solid" },
  "skiing": { icon: "person-skiing", type: "solid" },
  "snowboarding": { icon: "person-snowboarding", type: "solid" },
  "basketball": { icon: "basketball", type: "solid" },
  "football": { icon: "football", type: "solid" },
  "baseball": { icon: "baseball", type: "solid" },
  "volleyball": { icon: "volleyball", type: "solid" }
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
    queryFn: async ({ queryKey }) => {
      const [_, name, type] = queryKey;
      const response = await fetch(`/api/equipment/suggest-icons?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch icon suggestions');
      }
      const data = await response.json();
      return data.map((suggestion: any) => ({
        ...suggestion,
        ...defaultIcons[suggestion.key] || defaultIcons.dumbbell
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Font Awesome Equipment Icons</DialogTitle>
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
                    <FontAwesomeIcon 
                      icon={suggestion.icon} 
                      type={suggestion.type}
                      size="lg"
                    />
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