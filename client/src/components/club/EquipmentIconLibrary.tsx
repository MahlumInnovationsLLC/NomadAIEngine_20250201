import React, { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@db/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  Wand2
} from "lucide-react";
import { IconSuggestionDialog } from "./IconSuggestionDialog";

interface EquipmentIconProps {
  equipment: Equipment;
  isDragging?: boolean;
  onRequestSuggestion?: () => void;
}

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
};

const StatusIndicator = ({ status, className }: { status: string; className?: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
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

const EquipmentIcon = ({ equipment, isDragging, onRequestSuggestion }: EquipmentIconProps) => {
  const deviceType = equipment.deviceType?.toLowerCase() || 'strength';
  const Icon = equipmentIcons[deviceType] || Dumbbell;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "relative p-4 bg-background rounded-lg border cursor-move group",
        isDragging ? "shadow-lg ring-2 ring-primary" : "hover:bg-accent/50"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <StatusIndicator status={equipment.status} />
      <div className="flex flex-col items-center gap-2">
        <Icon className="w-8 h-8" />
        <span className="text-xs font-medium">{equipment.name}</span>
        <Badge variant="outline" className="text-xs">
          {equipment.deviceType || "Unknown"}
        </Badge>
        {onRequestSuggestion && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 left-1"
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

  const handleReorder = (reorderedEquipment: Equipment[]) => {
    if (onDragEnd) {
      onDragEnd(reorderedEquipment);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Icons</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            <Reorder.Group
              axis="y"
              values={equipment}
              onReorder={handleReorder}
              className="space-y-4"
            >
              {equipment.map((item) => (
                <Reorder.Item key={item.id} value={item}>
                  <EquipmentIcon
                    equipment={item}
                    onRequestSuggestion={() => handleRequestSuggestion(item)}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
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