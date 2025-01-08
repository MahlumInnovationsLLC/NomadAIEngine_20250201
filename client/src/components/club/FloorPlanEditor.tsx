import { useState, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { Equipment, FloorPlan } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GridIcon, Move, Plus, Save } from "lucide-react";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface Zone {
  id: string;
  name: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

interface FloorPlanEditorProps {
  floorPlan: FloorPlan | null;
  equipment: Equipment[];
  onSave: (updates: Partial<FloorPlan>) => void;
  onEquipmentMove: (equipmentId: number, position: { x: number; y: number }) => void;
}

export default function FloorPlanEditor({
  floorPlan,
  equipment,
  onSave,
  onEquipmentMove
}: FloorPlanEditorProps) {
  const [gridSize, setGridSize] = useState(floorPlan?.gridSize || 20);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(
    floorPlan?.dimensions as { width: number; height: number } || { width: 800, height: 600 }
  );
  const [zones, setZones] = useState<Zone[]>(floorPlan?.zones || []);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const { toast } = useToast();

  const handleDragEnd = async (equipmentId: number, info: any) => {
    const { point } = info;
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = point.x - rect.left;
      const y = point.y - rect.top;

      // Snap to grid
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedY = Math.round(y / gridSize) * gridSize;

      try {
        const response = await fetch(`/api/equipment/${equipmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            position: { x: snappedX, y: snappedY }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update equipment position');
        }

        onEquipmentMove(equipmentId, { x: snappedX, y: snappedY });
      } catch (error) {
        console.error('Failed to save equipment position:', error);
        toast({
          title: "Error",
          description: "Failed to update equipment position",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddZone = () => {
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: `Zone ${zones.length + 1}`,
      position: { x: 0, y: 0 },
      dimensions: { width: 200, height: 200 }
    };
    setZones([...zones, newZone]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/floor-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: floorPlan?.name || 'Default Layout',
          description: floorPlan?.description || null,
          gridSize,
          dimensions,
          zones,
          metadata: floorPlan?.metadata || {},
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save floor plan');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Floor plan saved successfully",
        });
        onSave({
          gridSize,
          dimensions,
          zones,
          metadata: floorPlan?.metadata || {}
        });
      }
    } catch (error) {
      console.error('Failed to save floor plan:', error);
      toast({
        title: "Error",
        description: "Failed to save floor plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-background p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <GridIcon className="h-4 w-4" />
          <Select
            value={gridSize.toString()}
            onValueChange={(value) => setGridSize(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Grid size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="40">40px</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Dimensions:</span>
          <Input
            type="number"
            value={dimensions.width}
            onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
            className="w-20"
          />
          <span>×</span>
          <Input
            type="number"
            value={dimensions.height}
            onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddZone}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-3/4">
          <div
            ref={editorRef}
            className="relative border rounded-lg bg-background overflow-hidden"
            style={{
              height: dimensions.height,
              width: dimensions.width
            }}
          >
            {/* Grid background */}
            <svg width="100%" height="100%" className="absolute pointer-events-none">
              <defs>
                <pattern
                  id="grid"
                  width={gridSize}
                  height={gridSize}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Zones */}
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="absolute border-2 border-dashed border-primary/50 rounded-lg p-2"
                style={{
                  left: zone.position.x,
                  top: zone.position.y,
                  width: zone.dimensions.width,
                  height: zone.dimensions.height
                }}
              >
                <div className="text-sm font-medium text-primary/70">{zone.name}</div>
              </div>
            ))}

            {/* Draggable equipment */}
            {equipment.map((item) => {
              const position = item.position as { x: number; y: number } || { x: 0, y: 0 };
              const statusColor = item.status === 'active' ? 'bg-green-500' :
                item.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500';

              return (
                <motion.div
                  key={item.id}
                  drag
                  dragControls={dragControls}
                  dragMomentum={false}
                  dragElastic={0}
                  onDragEnd={(_, info) => handleDragEnd(item.id, info)}
                  initial={false}
                  animate={{ x: position.x, y: position.y }}
                  className="absolute cursor-move"
                  style={{ left: 0, top: 0 }}
                >
                  <div className="relative w-10 h-10 bg-background rounded-lg border flex items-center justify-center">
                    <div className={`absolute -top-1 -right-1 w-2 h-2 ${statusColor} rounded-full border border-background`} />
                    <FontAwesomeIcon
                      iconName={item.deviceType || '10250144-stationary-bike-sports-competition-fitness-icon'}
                      type="kit"
                      size="lg"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="w-1/4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Performance Report</h3>
            <p className="text-sm text-muted-foreground">
              Select equipment items to generate a performance report
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}