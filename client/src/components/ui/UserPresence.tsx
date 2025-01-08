import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

interface UserPresenceProps {
  currentUserId: string;
}

export function UserPresence({ currentUserId }: UserPresenceProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    // Socket.IO connection is already handled by NotificationCenter
    // We'll just listen for presence events here
    const socket = window._socketInstance;

    if (!socket) return;

    socket.on('presence:update', (users: User[]) => {
      setActiveUsers(users);
    });

    // Request initial user list
    socket.emit('presence:join', { userId: currentUserId });

    return () => {
      socket.off('presence:update');
    };
  }, [currentUserId]);

  const onlineCount = activeUsers.filter(u => u.status === 'online').length;

  return (
    <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-lg">
      <div className="p-2 flex items-center gap-2">
        <h4 className="text-sm font-medium">Online Users</h4>
        <Badge variant="secondary" className="ml-2">
          {onlineCount}
        </Badge>
      </div>
      {activeUsers.length > 0 && (
        <ScrollArea className="w-[300px] max-h-[40px] overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1 px-2 pb-2">
            <AnimatePresence mode="popLayout">
              {activeUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white ${
                              user.status === 'online'
                                ? 'bg-green-500'
                                : user.status === 'away'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                            }`}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user.name} {user.id === currentUserId && '(You)'}</p>
                        {user.status !== 'online' && user.lastSeen && (
                          <p className="text-xs text-muted-foreground">
                            Last seen: {new Date(user.lastSeen).toLocaleString()}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}