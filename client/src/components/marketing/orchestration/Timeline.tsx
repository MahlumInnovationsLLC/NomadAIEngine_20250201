import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

interface TimelineProps {
  activeChannels: string[];
}

type TimelineEvent = {
  id: string;
  channel: string;
  time: string;
  action: string;
  status: "scheduled" | "running" | "completed" | "failed";
};

const mockEvents: TimelineEvent[] = [
  {
    id: "1",
    channel: "email",
    time: "9:00 AM",
    action: "Send welcome email",
    status: "completed"
  },
  {
    id: "2",
    channel: "social",
    time: "10:30 AM",
    action: "Post product announcement",
    status: "scheduled"
  },
  {
    id: "3",
    channel: "push",
    time: "2:00 PM",
    action: "Send push notification",
    status: "scheduled"
  }
];

export function Timeline({ activeChannels }: TimelineProps) {
  const getStatusColor = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "running":
        return "text-blue-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getChannelIcon = (channel: string): IconName => {
    switch (channel) {
      case "email":
        return "envelope";
      case "social":
        return "share-nodes";
      case "push":
        return "bell";
      case "sms":
        return "message";
      default:
        return "circle" as IconName;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Campaign Timeline</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FontAwesomeIcon
              icon={['fal' as IconPrefix, 'calendar' as IconName]}
              className="mr-2 h-4 w-4"
            />
            Schedule
          </Button>
          <Button variant="outline" size="sm">
            <FontAwesomeIcon
              icon={['fal' as IconPrefix, 'clock' as IconName]}
              className="mr-2 h-4 w-4"
            />
            Auto-schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-6 border-l-2 border-dashed border-gray-200" />
          <div className="space-y-6">
            {mockEvents
              .filter(event => activeChannels.includes(event.channel))
              .map(event => (
                <div key={event.id} className="flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-full bg-background border-2 flex items-center justify-center z-10">
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, getChannelIcon(event.channel)]}
                      className={`h-5 w-5 ${getStatusColor(event.status)}`}
                    />
                  </div>
                  <div className="flex-1 bg-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{event.action}</h4>
                      <span className="text-sm text-muted-foreground">{event.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: <span className={getStatusColor(event.status)}>{event.status}</span>
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
