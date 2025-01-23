import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  faCog,
  faExclamationTriangle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Add Outlook settings schema
const outlookSettingsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  redirectUri: z.string().url("Must be a valid URL"),
});

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date().optional(),
  type: z.enum(['campaign', 'meeting', 'deadline', 'event', 'social_media', 'email_blast']),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

interface MarketingEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  type: 'campaign' | 'meeting' | 'deadline' | 'event' | 'social_media' | 'email_blast';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  outlookEventId?: string;
  outlookCalendarId?: string;
  lastSyncedAt?: string;
}

export function MarketingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: selectedDate || new Date(),
      type: 'event',
      priority: 'medium',
    },
  });

  const settingsForm = useForm<z.infer<typeof outlookSettingsSchema>>({
    resolver: zodResolver(outlookSettingsSchema),
  });

  // Reset form when selected date changes
  useEffect(() => {
    if (selectedDate) {
      form.setValue('startDate', selectedDate);
    }
  }, [selectedDate, form]);

  // Fetch marketing events
  const { data: events = [], isLoading, refetch } = useQuery<MarketingEvent[]>({
    queryKey: ['/api/marketing/calendar/events'],
  });

  // Create event mutation
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
      refetch();
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

  // Save Outlook settings mutation
  const saveOutlookSettings = useMutation({
    mutationFn: async (data: z.infer<typeof outlookSettingsSchema>) => {
      const response = await fetch('/api/marketing/calendar/outlook-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to save Outlook settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Successfully saved Outlook calendar settings.",
      });
      setShowSettingsDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync with Outlook mutation
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
    onSuccess: () => {
      setSyncStatus('synced');
      toast({
        title: "Calendar Synced",
        description: "Successfully synchronized with Outlook calendar.",
      });
      refetch();
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

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Type-specific icon mapping
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

  // Priority-specific color mapping
  const getPriorityColor = (priority: MarketingEvent['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle event form submission
  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    createEvent.mutate(data);
  };

  // Handle settings form submission
  const onSettingsSubmit = (data: z.infer<typeof outlookSettingsSchema>) => {
    saveOutlookSettings.mutate(data);
  };

  // Custom day content renderer with enhanced visuals
  const DayContent = ({ date }: { date: Date }) => {
    const dayEvents = getEventsForDate(date);
    const hasEvents = dayEvents.length > 0;

    return (
      <div className="relative w-full h-full min-h-[80px] p-1">
        <div className={`w-full flex items-center justify-center ${hasEvents ? 'font-bold' : ''}`}>
          {date.getDate()}
        </div>
        {hasEvents && (
          <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 justify-center">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}
                title={`${event.title} (${event.priority} priority)`}
              />
            ))}
          </div>
        )}
      </div>
    );
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
            onClick={() => setShowSettingsDialog(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <FontAwesomeIcon icon={faCog} className="h-4 w-4" />
            Settings
          </Button>
          <Button
            onClick={() => syncWithOutlook.mutate()}
            disabled={syncStatus === 'syncing'}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <FontAwesomeIcon
              icon={
                syncStatus === 'syncing' ? faSpinner :
                syncStatus === 'error' ? faExclamationTriangle :
                syncStatus === 'synced' ? faCheckCircle :
                ['fab', 'microsoft']
              }
              className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
            />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Outlook'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid lg:grid-cols-[3fr,1fr] gap-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border p-4"
            components={{
              DayContent,
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
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <FontAwesomeIcon 
                            icon={getEventTypeIcon(event.type)}
                            className={`h-4 w-4 mt-1 ${
                              event.type === 'campaign' ? 'text-blue-500' :
                              event.type === 'social_media' ? 'text-green-500' :
                              event.type === 'email_blast' ? 'text-purple-500' :
                              event.type === 'meeting' ? 'text-yellow-500' :
                              'text-gray-500'
                            }`}
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
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant={
                              event.status === 'completed' ? 'default' :
                              event.status === 'in_progress' ? 'secondary' :
                              event.status === 'cancelled' ? 'destructive' :
                              'outline'
                            }
                          >
                            {event.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${
                              event.priority === 'urgent' ? 'border-red-500 text-red-500' :
                              event.priority === 'high' ? 'border-orange-500 text-orange-500' :
                              event.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                              'border-green-500 text-green-500'
                            }`}
                          >
                            {event.priority}
                          </Badge>
                        </div>
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
                            <FontAwesomeIcon icon={['fab', 'microsoft']} className="h-3 w-3" />
                            Synced
                          </span>
                        )}
                      </div>
                    </div>
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

      {/* Event creation dialog */}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

      {/* Outlook settings dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Outlook Calendar Settings</DialogTitle>
          </DialogHeader>
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
              <FormField
                control={settingsForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azure Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Azure Client ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsForm.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azure Client Secret</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter Azure Client Secret" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsForm.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azure Tenant ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Azure Tenant ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsForm.control}
                name="redirectUri"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URI</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Redirect URI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettingsDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Settings</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}