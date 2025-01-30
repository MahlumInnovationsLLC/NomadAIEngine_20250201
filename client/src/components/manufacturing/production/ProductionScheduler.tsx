import { useState, useMemo } from "react";
import { Scheduler } from "@aldabil/react-scheduler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductionSchedule, ProductionOrder, ProductionBay, ProductionTeam } from "@/types/manufacturing";
import { format, parseISO } from "date-fns";

interface ProcessedEvent {
  event_id: string | number;
  title: string;
  start: Date;
  end: Date;
  admin_id: string;
  editable?: boolean;
  deletable?: boolean;
  draggable?: boolean;
  color?: string;
  textColor?: string;
  allDay?: boolean;
  description?: string;
  status?: string;
  progress?: number;
  assignedTeam?: string;
}

interface ProductionSchedulerProps {
  productionLineId: string;
}

export function ProductionScheduler({ productionLineId }: ProductionSchedulerProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"day" | "week" | "month">("week");

  const { data: schedule, isLoading } = useQuery<ProductionSchedule>({
    queryKey: [`/api/manufacturing/schedule/${productionLineId}`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: bays = [] } = useQuery<ProductionBay[]>({
    queryKey: [`/api/manufacturing/bays/${productionLineId}`],
  });

  const { data: teams = [] } = useQuery<ProductionTeam[]>({
    queryKey: ['/api/manufacturing/teams'],
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: {
      orderId: string;
      updates: Partial<ProductionOrder>;
    }) => {
      const response = await fetch(`/api/manufacturing/orders/${data.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manufacturing/schedule/${productionLineId}`] });
    },
  });

  const events = useMemo(() => {
    if (!schedule) return [];

    return schedule.ganttItems.map(item => ({
      event_id: item.id,
      title: `${item.productName} (Order #${item.orderNumber})`,
      start: parseISO(item.startDate),
      end: parseISO(item.endDate),
      admin_id: item.assignedBay,
      color: item.type === 'maintenance' ? '#FFA500' :
        item.type === 'setup' ? '#4CAF50' : '#2196F3',
      textColor: '#fff',
      allDay: false,
      status: item.status,
      progress: item.progress,
      assignedTeam: item.assignedTeam,
      description: `Status: ${item.status}\nProgress: ${item.progress}%${
        item.assignedTeam ? `\nTeam: ${teams.find(t => t.id === item.assignedTeam)?.name}` : ''
      }`,
    }));
  }, [schedule, teams]);

  const resources = useMemo(() =>
    bays.map(bay => ({
      admin_id: bay.id,
      title: bay.name,
      mobile: bay.status,
      color: bay.status === 'available' ? '#4CAF50' :
        bay.status === 'maintenance' ? '#FFA500' : '#2196F3',
    })), [bays]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Production Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            Loading schedule...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Production Schedule</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            onClick={() => setView('day')}
            size="sm"
          >
            <FontAwesomeIcon icon="calendar-day" className="mr-2 h-4 w-4" />
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            onClick={() => setView('week')}
            size="sm"
          >
            <FontAwesomeIcon icon="calendar-week" className="mr-2 h-4 w-4" />
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            onClick={() => setView('month')}
            size="sm"
          >
            <FontAwesomeIcon icon="calendar" className="mr-2 h-4 w-4" />
            Month
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] mt-4">
          <Scheduler
            view={view}
            events={events}
            resources={resources}
            resourceFields={{
              idField: "admin_id",
              textField: "title",
              colorField: "color",
            }}
            fields={[
              {
                name: "status",
                type: "select",
                default: "scheduled",
                options: [
                  { id: "scheduled", text: "Scheduled", value: "scheduled" },
                  { id: "in_progress", text: "In Progress", value: "in_progress" },
                  { id: "completed", text: "Completed", value: "completed" },
                  { id: "delayed", text: "Delayed", value: "delayed" },
                ],
                config: { label: "Status" }
              },
              {
                name: "assignedTeam",
                type: "select",
                options: teams.map(team => ({
                  id: team.id,
                  text: team.name,
                  value: team.id,
                })),
                config: { label: "Assigned Team" }
              }
            ]}
            onEventDrop={async (_event, _droppedOn, updatedEvent, _originalEvent) => {
              const { event_id, start, end, admin_id } = updatedEvent;
              const bay = bays.find(b => b.id === admin_id);

              if (!bay) return; // Skip update if bay not found

              await updateScheduleMutation.mutateAsync({
                orderId: event_id.toString(),
                updates: {
                  startDate: start.toISOString(),
                  dueDate: end.toISOString(),
                  assignedBay: bay // Now passing the full bay object
                }
              });
            }}
            viewerExtraComponent={(_fields, event) => (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={
                      event.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        event.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                          event.status === 'delayed' ? 'bg-red-500/10 text-red-500' :
                            'bg-gray-500/10 text-gray-500'
                    }
                  >
                    {event.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Progress: {event.progress}%
                  </span>
                </div>
                {event.assignedTeam && (
                  <div className="text-sm">
                    Assigned Team: {teams.find(t => t.id === event.assignedTeam)?.name}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-2">
                  {format(event.start, 'PPp')} - {format(event.end, 'PPp')}
                </div>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}