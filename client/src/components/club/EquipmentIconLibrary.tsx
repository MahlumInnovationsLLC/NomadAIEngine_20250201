import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@db/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Grid, Wand2 } from "lucide-react";

// Import all the fitness equipment icons
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
  Scale,
  Gauge,
  BarChart3,
  Maximize2,
  Cable,
  Armchair,
  Dices,
  Tv2,
  Vibrate,
  Zap,
  LucideIcon
} from "lucide-react";
import { IconSuggestionDialog } from "./IconSuggestionDialog";

interface EquipmentIconProps {
  equipment: Equipment;
  isDragging?: boolean;
  onRequestSuggestion?: () => void;
  index: number;
  onDragStart: (e: any, index: number) => void;
  onDragEnter: (index: number) => void;
}

// Extended icon set for fitness equipment
const equipmentIcons: Record<string, LucideIcon> = {
  "treadmill": Footprints,
  "bike": Bike,
  "elliptical": Activity,
  "rowing": Waves,
  "weights": Weight,
  "timer": Timer,
  "cardio": Heart,
  "strength": Dumbbell,
  "screen": MonitorSmartphone,
  "target": Target,
  "scale": Scale,
  "gauge": Gauge,
  "metrics": BarChart3,
  "stretching": Maximize2,
  "cable": Cable,
  "bench": Armchair,
  "balance": Dices,
  "display": Tv2,
  "vibration": Vibrate,
  "power": Zap,
  // Add more fitness equipment specific icons
  "cross-trainer": Activity,
  "smith-machine": Weight,
  "leg-press": Footprints,
  "rowing-machine": Waves,
  "spin-bike": Bike,
  "power-rack": Dumbbell,
  "cable-machine": Cable,
  "bench-press": Weight,
  "stair-master": Footprints,
  "fitness-tracker": MonitorSmartphone
};

const StatusIndicator = ({ status, className }: { status: string; className?: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'offline':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={cn(
      "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
      getStatusColor(status),
      className
    )} />
  );
};

const EquipmentIcon = ({ 
  equipment, 
  isDragging,
  onRequestSuggestion,
  index,
  onDragStart,
  onDragEnter,
}: EquipmentIconProps) => {
  const deviceType = equipment.deviceType?.toLowerCase() || 'strength';
  const Icon = equipmentIcons[deviceType] || Dumbbell;

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.1 : 1,
        zIndex: isDragging ? 10 : 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative bg-background rounded-lg border cursor-grab active:cursor-grabbing w-[140px] h-[140px]",
        "flex flex-col items-center justify-center p-4",
        "hover:bg-accent/50 transition-colors",
        isDragging && "shadow-lg ring-2 ring-primary opacity-50"
      )}
    >
      <StatusIndicator status={equipment.status} />
      <div className="flex flex-col items-center gap-3">
        <div className="p-2 rounded-md bg-muted">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium text-center line-clamp-2">
          {equipment.name}
        </span>
        <Badge variant="outline" className="text-xs">
          {equipment.deviceType || "Unknown"}
        </Badge>
        {onRequestSuggestion && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRequestSuggestion();
            }}
          >
            <Wand2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

interface EquipmentIconLibraryProps {
  equipment: Equipment[];
  onDragEnd?: (equipment: Equipment[]) => void;
}

export function EquipmentIconLibrary({ equipment, onDragEnd }: EquipmentIconLibraryProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [items, setItems] = useState(equipment);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleRequestSuggestion = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowSuggestions(true);
  };

  const handleSelectIcon = async (iconKey: string) => {
    if (!selectedEquipment) return;

    try {
      await fetch(`/api/equipment/${selectedEquipment.id}/icon`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ iconKey }),
      });
    } catch (error) {
      console.error('Failed to update equipment icon:', error);
    }
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    setDraggedIdx(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnter = (index: number) => {
    if (draggedIdx === null) return;
    if (draggedIdx === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    if (onDragEnd) {
      onDragEnd(items);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="w-5 h-5" />
          Equipment Icons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDragEnd}
            >
              {items.map((item, index) => (
                <EquipmentIcon
                  key={item.id}
                  equipment={item}
                  isDragging={draggedIdx === index}
                  onRequestSuggestion={() => handleRequestSuggestion(item)}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </CardContent>

      {selectedEquipment && (
        <IconSuggestionDialog
          open={showSuggestions}
          onOpenChange={setShowSuggestions}
          equipmentName={selectedEquipment.name}
          equipmentType={selectedEquipment.deviceType || ''}
          onSelectIcon={handleSelectIcon}
        />
      )}
    </Card>
  );
}