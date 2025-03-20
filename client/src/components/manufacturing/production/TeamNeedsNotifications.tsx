import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket';
import { useLocation } from 'wouter';
import { TeamNeed } from '@/types/manufacturing';

// Types for notification payload
interface NotificationPayload {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
  createdAt: string;
  read: boolean;
  metadata?: {
    productionLineId: string;
    teamNeedId: string;
    teamNeed: TeamNeed;
    oldStatus?: string;
    newStatus?: string;
  };
}

export const TeamNeedsNotifications = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const socket = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new team need notifications
    const handleNewTeamNeed = (notification: NotificationPayload) => {
      if (notification.type === 'new_team_need') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: getPriorityVariant(notification.priority),
          duration: 8000, // Show for 8 seconds for high priority notifications
          // We'll handle navigation in the onClick directly
          // since 'action' may not be in the type
        });
        
        // If there's a link, log it - we could use this to navigate
        if (notification.link) {
          console.log('Notification link available:', notification.link);
          // Could implement custom UI to show a "View" button here
        }
      }
    };
    
    // Listen for team need status change notifications
    const handleTeamNeedStatusChange = (notification: NotificationPayload) => {
      if (notification.type === 'team_need_status_change') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: getPriorityVariant(notification.priority),
          duration: getNotificationDuration(notification.priority),
        });
        
        // If there's a link, log it for debugging
        if (notification.link) {
          console.log('Status change notification link:', notification.link);
          // In a real implementation, we could navigate or show a custom component
          // that includes a button linking to the team need
          setTimeout(() => {
            // After a short delay, navigate to the page
            // This gives the user time to see the toast first
            if (notification.link) {
              navigate(notification.link);
            }
          }, 1000);
        }
      }
    };
    
    // Handle all new notifications
    const handleNewNotification = (notification: NotificationPayload) => {
      console.log('Received notification:', notification);
      
      // Handle team needs specific notifications
      if (notification.type === 'new_team_need') {
        handleNewTeamNeed(notification);
      } else if (notification.type === 'team_need_status_change') {
        handleTeamNeedStatusChange(notification);
      }
    };
    
    // Register socket event listeners
    socket.on('notification:new', handleNewNotification);
    
    // Cleanup
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, toast, navigate]);
  
  // Utility function to map priority to toast variant
  const getPriorityVariant = (priority: 'low' | 'medium' | 'high' | 'urgent'): "default" | "destructive" => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Utility function to get notification duration based on priority
  const getNotificationDuration = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent':
        return 10000; // 10 seconds
      case 'high':
        return 8000; // 8 seconds
      case 'medium':
        return 5000; // 5 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  };
  
  // This component doesn't render anything visible
  return null;
};

export default TeamNeedsNotifications;