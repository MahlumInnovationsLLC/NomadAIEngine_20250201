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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import FloorPlanEditor from "./FloorPlanEditor";
import { io } from "socket.io-client";

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
  const [telemetryData, setTelemetryData] = useState<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const dimensions = floorPlan?.dimensions || { width: 800, height: 600 };

  // Connect to WebSocket for real-time telemetry updates
  useEffect(() => {
    socketRef.current = io(window.location.origin);

    socketRef.current.on('telemetry-update', (data: { equipmentId: string; metrics: any }) => {
      setTelemetryData(prev => ({
        ...prev,
        [data.equipmentId]: data.metrics
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const updateFloorPlanMutation = useMutation({
    mutationFn: async (updates: Partial<FloorPlan>) => {
      if (!floorPlan?.id) throw new Error('No floor plan to update');
      const response = await fetch(`/api/floor-plans/${floorPlan.id}`, {
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
    mutationFn: async ({ id, position }: { id: string; position: { x: number; y: number } }) => {
      const response = await fetch(`/api/equipment/${id}`, {
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
        id: equipmentId.toString(),
        position: newPosition,
      });
    } catch (error) {
      console.error('Failed to update equipment position:', error);
    }
  };

  const getEquipmentStatus = (equipment: Equipment) => {
    const telemetry = telemetryData[equipment.id];

    if (!equipment.deviceConnectionStatus || equipment.deviceConnectionStatus === 'disconnected') {
      return 'disconnected';
    }

    if (equipment.status === 'maintenance') {
      return 'maintenance';
    }

    if (telemetry?.alerts?.some((alert: any) => alert.severity === 'critical')) {
      return 'error';
    }

    if (telemetry?.alerts?.some((alert: any) => alert.severity === 'warning')) {
      return 'warning';
    }

    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">
          {floorPlan?.name || "Facility Layout"}
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
          <Button
            variant={isEditing ? "default" : "outline"}
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
          >
            <FontAwesomeIcon icon="pen" className="h-4 w-4" />
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
          style={{ height: dimensions.height }}
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
              width={dimensions.width}
              height={dimensions.height}
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
                const status = getEquipmentStatus(item);
                const telemetry = telemetryData[item.id];

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
                          ${getStatusColor(status)}
                          ${status === 'active' ? 'animate-pulse' : ''}
                        `} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-semibold">{item.name}</div>
                        <div>Status: {status}</div>
                        <div>Health: {item.healthScore}%</div>
                        {telemetry && (
                          <div className="mt-1 space-y-1">
                            {Object.entries(telemetry.metrics || {}).map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-2">
                                <span>{key}:</span>
                                <span className="font-mono">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>

            {/* Facility zones */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width={dimensions.width} height={dimensions.height}>
                {/* Zone outlines */}
                <rect x="50" y="50" width="200" height="150" 
                  fill="none" stroke="currentColor" strokeOpacity={0.2} />
                <rect x="300" y="50" width="250" height="200" 
                  fill="none" stroke="currentColor" strokeOpacity={0.2} />
                <rect x="50" y="250" width="300" height="200" 
                  fill="none" stroke="currentColor" strokeOpacity={0.2} />
                {/* Zone labels */}
                <text x="60" y="70" className="text-xs fill-current opacity-50">Production Area</text>
                <text x="310" y="70" className="text-xs fill-current opacity-50">Assembly Line</text>
                <text x="60" y="270" className="text-xs fill-current opacity-50">Storage Zone</text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}