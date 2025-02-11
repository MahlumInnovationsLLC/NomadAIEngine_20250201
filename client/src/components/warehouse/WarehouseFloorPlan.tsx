import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
}

interface WarehouseFloorPlanProps {
  floorPlan: WarehouseFloorPlan | null;
  warehouseId: string;
  isEditing?: boolean;
  onEditToggle?: () => void;
}

export default function WarehouseFloorPlan({ 
  floorPlan, 
  warehouseId,
  isEditing = false,
  onEditToggle 
}: WarehouseFloorPlanProps) {
  const { toast } = useToast();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const dimensions = floorPlan?.dimensions || { width: 1200, height: 800 };

  const updateFloorPlanMutation = useMutation({
    mutationFn: async (updates: Partial<WarehouseFloorPlan>) => {
      if (!floorPlan?.id) throw new Error('No floor plan to update');
      const response = await fetch(`/api/warehouse/${warehouseId}/floor-plan/${floorPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update floor plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/warehouse/${warehouseId}/floor-plan`] });
      toast({
        title: 'Floor Plan Updated',
        description: 'Successfully updated the warehouse floor plan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isEditing) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRackClick = (rackId: string) => {
    if (!isEditing) {
      setSelectedRack(rackId);
    }
  };

  const handleRackDragStart = (e: React.DragEvent, rackId: string) => {
    if (!isEditing) return;
    e.dataTransfer.setData('text/plain', rackId);
  };

  const handleRackDrop = (e: React.DragEvent) => {
    if (!isEditing || !containerRef.current) return;
    e.preventDefault();
    const rackId = e.dataTransfer.getData('text/plain');
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;

    // Snap to grid
    const gridSize = floorPlan?.gridSize || 50;
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    if (floorPlan && rackId) {
      const updatedRacking = floorPlan.racking.map(rack =>
        rack.id === rackId
          ? { ...rack, position: { x: snappedX, y: snappedY } }
          : rack
      );

      updateFloorPlanMutation.mutate({ racking: updatedRacking });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">
          {floorPlan?.name || "Warehouse Layout"}
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="icon" onClick={() => handleZoom(0.1)}>
                <FontAwesomeIcon icon="magnifying-glass-plus" className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleZoom(-0.1)}>
                <FontAwesomeIcon icon="magnifying-glass-minus" className="h-4 w-4" />
              </Button>
            </>
          )}
          {onEditToggle && (
            <Button
              variant={isEditing ? "default" : "outline"}
              size="icon"
              onClick={onEditToggle}
            >
              <FontAwesomeIcon icon="pen" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden border rounded-lg bg-background"
        style={{ height: dimensions.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleRackDrop}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Grid background */}
          <svg 
            width={dimensions.width}
            height={dimensions.height}
            className="pointer-events-none"
          >
            <defs>
              <pattern
                id="grid"
                width={floorPlan?.gridSize || 50}
                height={floorPlan?.gridSize || 50}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${floorPlan?.gridSize || 50} 0 L 0 0 0 ${floorPlan?.gridSize || 50}`}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Racking units */}
          <TooltipProvider>
            {floorPlan?.racking.map((rack) => (
              <Tooltip key={rack.id}>
                <TooltipTrigger asChild>
                  <div
                    draggable={isEditing}
                    onDragStart={(e) => handleRackDragStart(e, rack.id)}
                    className={`absolute cursor-pointer border-2 ${
                      selectedRack === rack.id ? 'border-primary' : 'border-muted'
                    } ${isEditing ? 'cursor-move' : ''}`}
                    style={{
                      left: rack.position.x,
                      top: rack.position.y,
                      width: rack.dimensions.width,
                      height: rack.dimensions.height,
                      transform: `scale(${1/scale})`,
                    }}
                    onClick={() => handleRackClick(rack.id)}
                  >
                    <div className="p-2 text-xs">
                      {rack.type}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-semibold">Rack Details</div>
                    <div>Type: {rack.type}</div>
                    <div>Capacity: {rack.capacity} units</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}