import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface FacilityNotification {
  id: number;
  type: 'module_assigned' | 'assessment_due' | 'achievement_earned' | 'module_completed' | 'system';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  expiresAt?: string;
  read: boolean;
}

export default function NotificationsPanel() {
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  const { data: notifications = [], isLoading, error } = useQuery<FacilityNotification[]>({
    queryKey: ['/api/notifications/facility'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPriorityColor = (priority: FacilityNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardContent className="h-[100px]" />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load notifications. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="relative"
        onClick={() => setShowAllNotifications(true)}
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          </>
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      <Dialog open={showAllNotifications} onOpenChange={setShowAllNotifications}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Facility Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`relative ${!notification.read ? 'bg-accent' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Badge 
                        className={`${getPriorityColor(notification.priority)} mt-1`}
                      >
                        {notification.priority}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          {notification.link && (
                            <Button variant="link" className="text-xs" asChild>
                              <a href={notification.link}>View Details</a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
