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

  return (
    <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-lg p-3 max-w-[300px]">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        Online Users
        <Badge variant="secondary" className="ml-auto">
          {activeUsers.filter(u => u.status === 'online').length}
        </Badge>
      </h4>
      <ScrollArea className="h-[200px]">
        <AnimatePresence mode="popLayout">
          {activeUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
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
                    <p>{user.name}</p>
                    {user.status !== 'online' && user.lastSeen && (
                      <p className="text-xs text-muted-foreground">
                        Last seen: {new Date(user.lastSeen).toLocaleString()}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm truncate">
                {user.name} {user.id === currentUserId && '(You)'}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
