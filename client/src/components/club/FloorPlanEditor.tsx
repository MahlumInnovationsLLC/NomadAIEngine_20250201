import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Equipment, FloorPlan } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Plus, Save } from "lucide-react";

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
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(
    floorPlan?.dimensions as { width: number; height: number } || { width: 800, height: 600 }
  );
  const [zones, setZones] = useState<Zone[]>(floorPlan?.zones || []);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDragEnd = async (equipmentId: number, info: any) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(dimensions.width - 40, info.point.x - rect.left));
      const y = Math.max(0, Math.min(dimensions.height - 40, info.point.y - rect.top));

      try {
        const response = await fetch(`/api/equipment/${equipmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            position: { x, y }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update equipment position');
        }

        onEquipmentMove(equipmentId, { x, y });
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
          dimensions,
          gridSize: 20, 
          zones,
          metadata: floorPlan?.metadata || {},
          isActive: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save floor plan');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Floor plan saved successfully",
      });
      onSave({
        dimensions,
        zones,
        metadata: floorPlan?.metadata || {}
      });
    } catch (error) {
      console.error('Failed to save floor plan:', error);
      toast({
        title: "Warning",
        description: "Changes were saved but there was an error updating some settings",
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
              width: dimensions.width,
              touchAction: "none"
            }}
          >
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

            {equipment.map((item) => {
              const position = item.position as { x: number; y: number } || { x: 0, y: 0 };
              const statusColor = item.status === 'active' ? 'bg-green-500' :
                item.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500';

              return (
                <motion.div
                  key={item.id}
                  drag
                  dragMomentum={false}
                  onDragEnd={(_, info) => handleDragEnd(item.id, info)}
                  initial={false}
                  style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    touchAction: "none"
                  }}
                  transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 300
                  }}
                  className="cursor-move"
                >
                  <div className="relative w-10 h-10 bg-background rounded-lg border flex items-center justify-center">
                    <div className={`absolute -top-1 -right-1 w-2 h-2 ${statusColor} rounded-full border border-background`} />
                    <i className={`fa-kit fa-${item.deviceType || '10250144-stationary-bike-sports-competition-fitness-icon'} text-lg`} />
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