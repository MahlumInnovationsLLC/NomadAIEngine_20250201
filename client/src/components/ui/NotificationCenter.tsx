import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: number;
  type: 'module_assigned' | 'assessment_due' | 'achievement_earned' | 'module_completed' | 'system';
  title: string;
  message: string;
  link?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
}

const priorityColors = {
  low: "bg-gray-100 dark:bg-gray-800",
  medium: "bg-blue-100 dark:bg-blue-900",
  high: "bg-orange-100 dark:bg-orange-900",
  urgent: "bg-red-100 dark:bg-red-900",
};

const priorityBadgeColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function NotificationCenter() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For demo, using a hardcoded user ID
  const userId = "1";

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', userId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(window.location.origin, {
      query: { userId },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('notification:new', (data) => {
      // Show toast for new notification with priority-based styling
      toast({
        title: data.title,
        description: data.message,
        duration: data.priority === 'urgent' ? 10000 : 5000,
        variant: data.priority === 'urgent' ? 'destructive' : 'default',
      });
      // Invalidate notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient, toast]);

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;
  const urgentCount = notifications?.filter(n => !n.read && n.priority === 'urgent').length ?? 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            notificationIds: [notification.id],
          }),
        });

        queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${urgentCount > 0 ? 'text-red-500' : ''}`} />
          {unreadCount > 0 && (
            <Badge
              variant={urgentCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <ScrollArea className="h-[500px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-4 cursor-pointer ${
                  !notification.read ? priorityColors[notification.priority] : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{notification.title}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {!notification.read && (
                      <Badge variant="secondary">New</Badge>
                    )}
                    <Badge
                      className={priorityBadgeColors[notification.priority]}
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}