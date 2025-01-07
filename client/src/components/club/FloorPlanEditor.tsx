import { useState, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { Equipment, FloorPlan } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GridIcon, Move, Plus, Save } from "lucide-react";

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
  const editorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const handleDragEnd = (equipmentId: number, info: any) => {
    const { point } = info;
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = point.x - rect.left;
      const y = point.y - rect.top;

      // Snap to grid
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedY = Math.round(y / gridSize) * gridSize;

      onEquipmentMove(equipmentId, { x: snappedX, y: snappedY });
    }
  };

  const handleSave = () => {
    onSave({
      gridSize,
      dimensions,
      metadata: floorPlan?.metadata || {}
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </div>
      </div>

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

        {/* Draggable equipment */}
        {equipment.map((item) => {
          const position = item.position as { x: number; y: number } || { x: 0, y: 0 };

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
              <Card className={`
                p-2 select-none border-2
                ${item.status === 'active' ? 'border-green-500' :
                  item.status === 'maintenance' ? 'border-yellow-500' : 'border-red-500'}
              `}>
                <div className="flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}