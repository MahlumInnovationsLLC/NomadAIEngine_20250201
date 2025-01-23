import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  faTimes,
  faSpinner,
  faCalendarPlus,
  faUsers,
  faBullhorn,
  faEnvelope,
  faHashtag,
  faCalendarCheck,
  faLocationDot,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faMicrosoft } from "@fortawesome/free-brands-svg-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useWebSocket } from "@/hooks/use-websocket";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date().optional(),
  type: z.enum(['campaign', 'meeting', 'deadline', 'event', 'social_media', 'email_blast']),
  location: z.string().optional(),
});

interface MarketingEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  type: 'campaign' | 'meeting' | 'deadline' | 'event' | 'social_media' | 'email_blast';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  outlookEventId?: string;
  outlookCalendarId?: string;
  lastSyncedAt?: string;
}

export function MarketingCalendar() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { toast } = useToast();
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('calendar_event_created', (event: MarketingEvent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/calendar/events'] });
      toast({
        title: "New Event Created",
        description: `${event.title} has been added to the calendar.`,
      });
    });

    socket.on('calendar_event_updated', (event: MarketingEvent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/calendar/events'] });
      toast({
        title: "Event Updated",
        description: `${event.title} has been updated.`,
      });
    });

    return () => {
      socket.off('calendar_event_created');
      socket.off('calendar_event_updated');
    };
  }, [socket, queryClient, toast]);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: selectedDate || new Date(),
      type: 'event',
    },
  });

  useEffect(() => {
    if (selectedDate) {
      form.setValue('startDate', selectedDate);
    }
  }, [selectedDate, form]);

  const startOfMonth = new Date(selectedDate?.getFullYear() || new Date().getFullYear(), 
                               selectedDate?.getMonth() || new Date().getMonth(), 1);
  const endOfMonth = new Date(selectedDate?.getFullYear() || new Date().getFullYear(), 
                             (selectedDate?.getMonth() || new Date().getMonth()) + 1, 0);

  const { data: events = [], isLoading } = useQuery<MarketingEvent[]>({
    queryKey: ['/api/marketing/calendar/events', startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/marketing/calendar/events?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  const createEvent = useMutation({
    mutationFn: async (data: z.infer<typeof eventSchema>) => {
      const response = await fetch('/api/marketing/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Successfully created new marketing event.",
      });
      setShowEventDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/calendar/events'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncWithOutlook = useMutation({
    mutationFn: async () => {
      setSyncStatus('syncing');
      const response = await fetch('/api/marketing/calendar/sync-outlook', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to sync with Outlook');
      return response.json();
    },
    onSuccess: (data) => {
      setSyncStatus('synced');
      toast({
        title: "Calendar Synced",
        description: `Successfully synchronized ${data.syncedEvents.length} events with Outlook calendar.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/calendar/events'] });
    },
    onError: (error) => {
      setSyncStatus('error');
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getEventsForDate = (date: Date) => {
    const dayStart = startOfDay(date);
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return startOfDay(eventDate).getTime() === dayStart.getTime();
    });
  };

  const organizeEvents = (events: MarketingEvent[]) => {
    const now = new Date();
    return {
      past: events.filter(e => isBefore(new Date(e.startDate), now)),
      current: events.filter(e => {
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : start;
        return !isBefore(end, now) && !isAfter(start, now);
      }),
      upcoming: events.filter(e => isAfter(new Date(e.startDate), now)),
    };
  };

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    createEvent.mutate(data);
  };

  const getEventTypeIcon = (type: MarketingEvent['type']) => {
    switch (type) {
      case 'campaign':
        return faBullhorn;
      case 'meeting':
        return faUsers;
      case 'email_blast':
        return faEnvelope;
      case 'social_media':
        return faHashtag;
      default:
        return faCalendarCheck;
    }
  };

  const getEventTypeColor = (type: MarketingEvent['type']) => {
    switch (type) {
      case 'campaign':
        return 'text-blue-500';
      case 'social_media':
        return 'text-green-500';
      case 'email_blast':
        return 'text-purple-500';
      case 'meeting':
        return 'text-yellow-500';
      case 'deadline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getEventStatusVariant = (status: MarketingEvent['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Marketing Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowEventDialog(true)}
            size="sm"
            className="gap-2"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="h-4 w-4" />
            Add Event
          </Button>
          <Button
            onClick={() => syncWithOutlook.mutate()}
            disabled={syncStatus === 'syncing'}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <FontAwesomeIcon
              icon={syncStatus === 'syncing' ? faSpinner : faMicrosoft}
              className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
            />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Outlook'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid lg:grid-cols-[1fr,300px] gap-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            components={{
              DayContent: ({ date }) => {
                const dayEvents = getEventsForDate(date);
                const hasEvents = dayEvents.length > 0;
                const isToday = startOfDay(date).getTime() === startOfDay(new Date()).getTime();

                return (
                  <div className="relative w-full h-full">
                    <div className={`w-full h-full flex items-center justify-center 
                      ${hasEvents ? 'font-bold' : ''} 
                      ${isToday ? 'bg-primary/10 rounded-full' : ''}`}
                    >
                      {date.getDate()}
                    </div>
                    {hasEvents && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1">
                        {dayEvents.slice(0, 3).map((event, index) => (
                          <div
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.type === 'campaign' ? 'bg-blue-500' :
                              event.type === 'social_media' ? 'bg-green-500' :
                              event.type === 'email_blast' ? 'bg-purple-500' :
                              event.type === 'meeting' ? 'bg-yellow-500' :
                              event.type === 'deadline' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No Date Selected'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate && (
                <div className="space-y-6">
                  {Object.entries(organizeEvents(getEventsForDate(selectedDate))).map(([period, periodEvents]) => (
                    periodEvents.length > 0 && (
                      <div key={period} className="space-y-2">
                        <h3 className="text-sm font-medium capitalize">
                          {period} Events
                        </h3>
                        <div className="space-y-2">
                          {periodEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg border hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <FontAwesomeIcon 
                                    icon={getEventTypeIcon(event.type)}
                                    className={`h-4 w-4 mt-1 ${getEventTypeColor(event.type)}`}
                                  />
                                  <div>
                                    <h4 className="font-medium">{event.title}</h4>
                                    {event.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {event.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant={getEventStatusVariant(event.status)}
                                >
                                  {event.status}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {event.type.replace('_', ' ')}
                                </Badge>
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                    {event.location}
                                  </span>
                                )}
                                {event.outlookEventId && (
                                  <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faMicrosoft} className="h-3 w-3" />
                                    Synced
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                  {getEventsForDate(selectedDate).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No events scheduled for this date
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Marketing Event</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Event description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="campaign">Campaign</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="email_blast">Email Blast</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEventDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Event</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}