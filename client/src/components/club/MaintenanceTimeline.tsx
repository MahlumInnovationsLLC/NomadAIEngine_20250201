import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Equipment } from "@db/schema";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MaintenanceEvent {
  date: Date;
  type: 'completed' | 'scheduled' | 'missed';
  description: string;
  healthScore?: number;
  notes?: string;
}

interface MaintenanceTimelineProps {
  equipment: Equipment[];
}

export function MaintenanceTimeline({ equipment }: MaintenanceTimelineProps) {
  // Generate historical maintenance data from equipment records
  const generateMaintenanceEvents = (eq: Equipment): MaintenanceEvent[] => {
    const events: MaintenanceEvent[] = [];

    // Add completed maintenance events
    if (eq.lastMaintenance) {
      events.push({
        date: new Date(eq.lastMaintenance),
        type: 'completed',
        description: 'Regular maintenance completed',
        healthScore: Number(eq.healthScore),
        notes: eq.maintenanceNotes || undefined
      });
    }

    // Add scheduled maintenance
    if (eq.nextMaintenance) {
      events.push({
        date: new Date(eq.nextMaintenance),
        type: 'scheduled',
        description: 'Scheduled maintenance',
        notes: eq.maintenanceNotes || undefined
      });
    }

    // Sort events by date
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const allEvents = equipment.flatMap(eq => 
    generateMaintenanceEvents(eq).map(event => ({
      ...event,
      equipment: eq
    }))
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Timeline</CardTitle>
        <CardDescription>
          Historical and scheduled maintenance events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-8">
            {allEvents.map((event, index) => (
              <motion.div
                key={`${event.equipment.id}-${event.date.getTime()}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-10"
              >
                {/* Timeline dot */}
                <motion.div
                  className={cn(
                    "absolute left-3 w-3 h-3 rounded-full -translate-x-1.5",
                    event.type === 'completed' ? "bg-green-500" :
                    event.type === 'scheduled' ? "bg-blue-500" : "bg-red-500"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                />

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {event.equipment.name}
                      </span>
                      <Badge variant={
                        event.type === 'completed' ? "default" :
                        event.type === 'scheduled' ? "outline" : "destructive"
                      }>
                        {event.type === 'completed' && <FontAwesomeIcon icon="circle-check" className="w-3 h-3 mr-1" />}
                        {event.type === 'scheduled' && <FontAwesomeIcon icon="calendar" className="w-3 h-3 mr-1" />}
                        {event.type === 'missed' && <FontAwesomeIcon icon="triangle-exclamation" className="w-3 h-3 mr-1" />}
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
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
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {event.date.toLocaleDateString()}
                    </div>
                    {event.healthScore !== undefined && (
                      <div className={cn(
                        "text-sm",
                        event.healthScore >= 80 ? "text-green-500" :
                        event.healthScore >= 60 ? "text-yellow-500" : "text-red-500"
                      )}>
                        Health Score: {event.healthScore}%
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}