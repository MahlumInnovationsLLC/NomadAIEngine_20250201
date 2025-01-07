import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as solidIcons from "@fortawesome/pro-solid-svg-icons";
import * as regularIcons from "@fortawesome/pro-regular-svg-icons";
import * as lightIcons from "@fortawesome/pro-light-svg-icons";
import * as thinIcons from "@fortawesome/pro-thin-svg-icons";
import * as duotoneIcons from "@fortawesome/pro-duotone-svg-icons";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IconSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  equipmentType: string;
  onSelectIcon: (iconKey: string) => void;
}

// Font Awesome icon styles with their corresponding libraries
const iconStyles = [
  { key: 'solid', library: solidIcons, prefix: 'fas', label: 'Solid' },
  { key: 'regular', library: regularIcons, prefix: 'far', label: 'Regular' },
  { key: 'light', library: lightIcons, prefix: 'fal', label: 'Light' },
  { key: 'thin', library: thinIcons, prefix: 'fat', label: 'Thin' },
  { key: 'duotone', library: duotoneIcons, prefix: 'fad', label: 'Duotone' }
];

// Common fitness equipment icons
const fitnessIcons = [
  // Cardio Equipment
  { name: 'person-running', label: 'Running' },
  { name: 'person-walking', label: 'Walking' },
  { name: 'bicycle', label: 'Bicycle' },
  { name: 'person-biking', label: 'Cycling' },
  { name: 'stairs', label: 'Stairs' },
  { name: 'heart-pulse', label: 'Heart Rate' },

  // Strength Equipment
  { name: 'dumbbell', label: 'Dumbbell' },
  { name: 'weight-hanging', label: 'Weight' },
  { name: 'person-walking-with-cane', label: 'Balance' },
  { name: 'person-dots-from-line', label: 'Movement' },

  // Recovery & Flexibility
  { name: 'person-stretching', label: 'Stretching' },
  { name: 'spa', label: 'Wellness' },
  { name: 'person-swimming', label: 'Swimming' },
  { name: 'hot-tub-person', label: 'Recovery' },

  // Metrics & Monitoring
  { name: 'gauge-high', label: 'Performance' },
  { name: 'chart-line', label: 'Metrics' },
  { name: 'stopwatch-20', label: 'Timer' },
  { name: 'scale-balanced', label: 'Balance' },

  // General Equipment
  { name: 'bed-pulse', label: 'Equipment' },
  { name: 'tape', label: 'Measurement' },
  { name: 'chair', label: 'Seating' },
  { name: 'toolbox', label: 'Maintenance' }
];

export function IconSuggestionDialog({ 
  open, 
  onOpenChange, 
  equipmentName,
  equipmentType,
  onSelectIcon 
}: IconSuggestionDialogProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('solid');
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
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get icon from library
  const getIconFromLibrary = (iconName: string, style: string) => {
    const currentStyle = iconStyles.find(s => s.key === style);
    if (!currentStyle) return null;

    const iconKey = `fa${iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`;
    return currentStyle.library[iconKey as keyof typeof currentStyle.library];
  };

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

          <Tabs defaultValue="solid" onValueChange={setSelectedStyle}>
            <TabsList className="w-full">
              {iconStyles.map(style => (
                <TabsTrigger
                  key={style.key}
                  value={style.key}
                  className="flex-1"
                >
                  {style.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {iconStyles.map(style => (
              <TabsContent key={style.key} value={style.key}>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredIcons.map((icon) => {
                      const faIcon = getIconFromLibrary(icon.name, style.key);
                      if (!faIcon) return null;

                      return (
                        <div
                          key={`${style.key}-${icon.name}`}
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
                              <FontAwesomeIcon icon={faIcon} size="lg" />
                            </div>
                            <div className="text-sm font-medium text-center">
                              {icon.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
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