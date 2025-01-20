import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@db/schema";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  date: Date;
  type: 'installation' | 'maintenance' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  healthScore?: number;
  notes?: string;
  technician?: string;
  cost?: number;
}

interface EquipmentLifecycleTimelineProps {
  equipment: Equipment;
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'installation':
      return 'gear';
    case 'maintenance':
      return 'rotate';
    case 'repair':
      return 'triangle-exclamation';
    case 'upgrade':
      return 'arrow-trend-up';
    case 'inspection':
      return 'circle-check';
    default:
      return 'calendar-days';
  }
};

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'installation':
      return 'text-blue-500';
    case 'maintenance':
      return 'text-yellow-500';
    case 'repair':
      return 'text-red-500';
    case 'upgrade':
      return 'text-purple-500';
    case 'inspection':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

export function EquipmentLifecycleTimeline({ equipment }: EquipmentLifecycleTimelineProps) {
  const generateLifecycleEvents = (eq: Equipment): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add installation event (first event)
    events.push({
      date: new Date(eq.createdAt),
      type: 'installation',
      description: 'Equipment installed and configured',
      healthScore: 100,
    });

    // Add maintenance events
    if (eq.lastMaintenance) {
      events.push({
        date: new Date(eq.lastMaintenance),
        type: 'maintenance',
        description: 'Regular maintenance performed',
        healthScore: Number(eq.healthScore),
        notes: eq.maintenanceNotes || undefined
      });
    }

    // Add future scheduled maintenance
    if (eq.nextMaintenance) {
      events.push({
        date: new Date(eq.nextMaintenance),
        type: 'maintenance',
        description: 'Scheduled maintenance',
        notes: eq.maintenanceNotes || undefined
      });
    }

    // Sort events by date
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const events = generateLifecycleEvents(equipment);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-xl">Equipment Lifecycle Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {events.map((event, index) => {
              const iconName = getEventIcon(event.type);
              return (
                <motion.div
                  key={`${event.type}-${event.date.getTime()}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-10"
                >
                  {/* Timeline dot */}
                  <motion.div
                    className={cn(
                      "absolute left-3 w-3 h-3 rounded-full -translate-x-1.5 border-2 border-background",
                      getEventColor(event.type).replace('text-', 'bg-')
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  />

                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={iconName} className={cn("h-4 w-4", getEventColor(event.type))} />
                        <span className="text-sm font-medium capitalize">
                          {event.type}
                        </span>
                        <Badge variant="outline">
                          {event.date.toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      {event.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Notes: {event.notes}
                        </p>
                      )}
                      {event.healthScore !== undefined && (
                        <div className={cn(
                          "text-sm mt-1",
                          event.healthScore >= 80 ? "text-green-500" :
                          event.healthScore >= 60 ? "text-yellow-500" : "text-red-500"
                        )}>
                          Health Score: {event.healthScore}%
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}