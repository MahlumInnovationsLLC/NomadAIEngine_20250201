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
  equipment?: Equipment;
}

interface MaintenanceTimelineProps {
  equipment: Equipment[];
}

export function MaintenanceTimeline({ equipment }: MaintenanceTimelineProps) {
  const generateMaintenanceEvents = (eq: Equipment): MaintenanceEvent[] => {
    const events: MaintenanceEvent[] = [];

    if (eq.lastMaintenance) {
      events.push({
        date: new Date(eq.lastMaintenance),
        type: 'completed',
        description: 'Regular maintenance completed',
        healthScore: Number(eq.healthScore || 0),
        notes: eq.maintenanceNotes || undefined
      });
    }

    if (eq.nextMaintenance) {
      events.push({
        date: new Date(eq.nextMaintenance),
        type: 'scheduled',
        description: 'Scheduled maintenance',
        notes: eq.maintenanceNotes || undefined
      });
    }

    return events;
  };

  const allEvents = equipment
    .filter(eq => eq && (eq.lastMaintenance || eq.nextMaintenance))
    .flatMap(eq => 
      generateMaintenanceEvents(eq).map(event => ({
        ...event,
        equipment: eq
      }))
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
      {allEvents.map((event, index) => (
        <motion.div
          key={`${event.equipment?.id}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                event.type === 'completed' ? "bg-green-100" : "bg-blue-100"
              )}>
                <FontAwesomeIcon 
                  icon={event.type === 'completed' ? "check" : "clock"} 
                  className={cn(
                    "h-6 w-6",
                    event.type === 'completed' ? "text-green-600" : "text-blue-600"
                  )}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">{event.equipment?.name}</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                )}
              </div>
              <div className="text-right">
                <Badge variant={event.type === 'completed' ? 'default' : 'secondary'}>
                  {event.type}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.date.toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}