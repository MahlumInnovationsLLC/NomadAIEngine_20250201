import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";

interface RackingUnit {
  id: string;
  type: 'single' | 'double' | 'drive-in';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  capacity: number;
}

interface WarehouseFloorPlan {
  id: string;
  warehouseId: string;
  name: string;
  dimensions: { width: number; height: number };
  gridSize: number;
  racking: RackingUnit[];
  imageUrl?: string;
}

interface WarehouseFloorPlanEditorProps {
  floorPlan: WarehouseFloorPlan | null;
  onSave: (updates: Partial<WarehouseFloorPlan>) => void;
  onCancel: () => void;
}

const RACKING_TEMPLATES = {
  'single': { width: 100, height: 200, capacity: 50 },
  'double': { width: 200, height: 200, capacity: 100 },
  'drive-in': { width: 300, height: 400, capacity: 200 },
};

export default function WarehouseFloorPlanEditor({ 
  floorPlan, 
  onSave, 
  onCancel 
}: WarehouseFloorPlanEditorProps) {
  const { toast } = useToast();
  const [name, setName] = useState(floorPlan?.name || '');
  const [gridSize, setGridSize] = useState(floorPlan?.gridSize || 50);
  const [racking, setRacking] = useState<RackingUnit[]>(floorPlan?.racking || []);
  const [selectedRackType, setSelectedRackType] = useState<keyof typeof RACKING_TEMPLATES>('single');
  const [draggingRack, setDraggingRack] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, rackId?: string) => {
    if (rackId) {
      setDraggingRack(rackId);
    } else {
      // Creating new rack
      const newRack: RackingUnit = {
        id: `rack-${Date.now()}`,
        type: selectedRackType,
        position: { x: 0, y: 0 },
        dimensions: RACKING_TEMPLATES[selectedRackType],
        capacity: RACKING_TEMPLATES[selectedRackType].capacity,
      };
      setRacking([...racking, newRack]);
      setDraggingRack(newRack.id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingRack || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Snap to grid
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    setRacking(prev => prev.map(rack => 
      rack.id === draggingRack
        ? { ...rack, position: { x: snappedX, y: snappedY } }
        : rack
    ));
    setDraggingRack(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
  };

  const handleSave = async () => {
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`/api/warehouse/${floorPlan?.warehouseId}/floor-plan/image`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload floor plan image');
        }

        const { imageUrl } = await response.json();

        onSave({
          name,
          gridSize,
          racking,
          imageUrl,
        });
      } else {
        onSave({
          name,
          gridSize,
          racking,
        });
      }
    } catch (error) {
      console.error('Error saving floor plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save floor plan',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Label htmlFor="name">Floor Plan Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className="p-4 w-[200px]">
          <h4 className="font-medium mb-4">Add Racking</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rack Type</Label>
              <Select
                value={selectedRackType}
                onValueChange={(value: keyof typeof RACKING_TEMPLATES) => 
                  setSelectedRackType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Deep</SelectItem>
                  <SelectItem value="double">Double Deep</SelectItem>
                  <SelectItem value="drive-in">Drive-In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              draggable
              onDragStart={(e) => handleDragStart(e)}
              className="border-2 border-dashed border-muted p-4 text-center cursor-move hover:border-primary"
            >
              Drag to add {selectedRackType} rack
            </div>

            <div className="space-y-2">
              <Label htmlFor="floorPlanImage">Upload Floor Plan</Label>
              <Input
                id="floorPlanImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </Card>

        <div
          ref={containerRef}
          className="flex-1 relative border rounded-lg bg-background overflow-hidden"
          style={{ height: floorPlan?.dimensions.height || 800 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Background image if exists */}
          {floorPlan?.imageUrl && (
            <img
              src={floorPlan.imageUrl}
              alt="Floor Plan"
              className="absolute inset-0 w-full h-full object-contain opacity-50"
            />
          )}

          {/* Grid background */}
          <svg 
            width="100%"
            height="100%"
            className="pointer-events-none absolute"
          >
            <defs>
              <pattern
                id="editor-grid"
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
            <rect width="100%" height="100%" fill="url(#editor-grid)" />
          </svg>

          {/* Racking units */}
          {racking.map((rack) => (
            <div
              key={rack.id}
              draggable
              onDragStart={(e) => handleDragStart(e, rack.id)}
              className={`absolute cursor-move border-2 ${
                draggingRack === rack.id ? 'border-primary' : 'border-muted'
              }`}
              style={{
                left: rack.position.x,
                top: rack.position.y,
                width: rack.dimensions.width,
                height: rack.dimensions.height,
              }}
            >
              <div className="p-2 text-xs">
                {rack.type}
                <br />
                {rack.capacity} units
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}