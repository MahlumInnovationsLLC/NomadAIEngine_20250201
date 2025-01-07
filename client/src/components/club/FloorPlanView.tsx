import { useState, useRef, useEffect } from "react";
import { Equipment, FloorPlan } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZoomIn, ZoomOut, Move, Edit2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FloorPlanEditor from "./FloorPlanEditor";

interface FloorPlanViewProps {
  floorPlan: FloorPlan | null;
  equipment: Equipment[];
}

export default function FloorPlanView({ floorPlan, equipment }: FloorPlanViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const updateFloorPlanMutation = useMutation({
    mutationFn: async (updates: Partial<FloorPlan>) => {
      const response = await fetch(`/api/floor-plans/${floorPlan?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update floor plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans/active'] });
    },
  });

  const updateEquipmentPositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: number; position: { x: number; y: number } }) => {
      const response = await fetch(`/api/equipment/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      });
      if (!response.ok) throw new Error('Failed to update equipment position');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
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

  const handleSaveFloorPlan = async (updates: Partial<FloorPlan>) => {
    try {
      await updateFloorPlanMutation.mutateAsync(updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save floor plan:', error);
    }
  };

  const handleEquipmentMove = async (equipmentId: number, newPosition: { x: number; y: number }) => {
    try {
      await updateEquipmentPositionMutation.mutateAsync({
        id: equipmentId,
        position: newPosition,
      });
    } catch (error) {
      console.error('Failed to update equipment position:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">
          {floorPlan?.name || "Default Layout"}
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="icon" onClick={() => handleZoom(0.1)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleZoom(-0.1)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Move className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <FloorPlanEditor
          floorPlan={floorPlan}
          equipment={equipment}
          onSave={handleSaveFloorPlan}
          onEquipmentMove={handleEquipmentMove}
        />
      ) : (
        <div
          ref={containerRef}
          className="relative overflow-hidden border rounded-lg bg-background"
          style={{ height: floorPlan?.dimensions?.height || 600 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
              width={floorPlan?.dimensions?.width || 800} 
              height={floorPlan?.dimensions?.height || 600} 
              className="pointer-events-none"
            >
              <defs>
                <pattern
                  id="grid"
                  width={floorPlan?.gridSize || 20}
                  height={floorPlan?.gridSize || 20}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${floorPlan?.gridSize || 20} 0 L 0 0 0 ${floorPlan?.gridSize || 20}`}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Equipment markers */}
            <TooltipProvider>
              {equipment.map((item) => {
                if (!item.position) return null;
                const pos = item.position as { x: number; y: number };

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute cursor-pointer"
                        style={{
                          left: pos.x,
                          top: pos.y,
                          transform: `scale(${1/scale})`,
                        }}
                      >
                        <div className={`
                          h-4 w-4 rounded-full
                          ${item.status === 'active' ? 'bg-green-500' : 
                            item.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}
                          animate-pulse
                        `} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-semibold">{item.name}</div>
                        <div>Status: {item.status}</div>
                        <div>Health: {item.healthScore}%</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
            {/* Example room layouts */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width={width} height={height}>
                {/* Example room outlines */}
                <rect x="50" y="50" width="200" height="150" 
                  fill="none" stroke="currentColor" strokeOpacity={0.2} />
                <rect x="300" y="50" width="250" height="200" 
                  fill="none" stroke="currentColor" strokeOpacity={0.2} />
                <rect x="50" y="250" width="300" height="200" 
                  fill="none" stroke="currentColor" strokeOpacity={0.2} />
                {/* Room labels */}
                <text x="60" y="70" className="text-xs fill-current opacity-50">Cardio Area</text>
                <text x="310" y="70" className="text-xs fill-current opacity-50">Weight Training</text>
                <text x="60" y="270" className="text-xs fill-current opacity-50">Group Fitness</text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}