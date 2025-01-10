import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Users className="h-5 w-5" />
          {onlineCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {onlineCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <div className="p-2">
          <h4 className="text-sm font-medium mb-2">Online Users</h4>
          <ScrollArea className="h-[300px]">
            <AnimatePresence mode="popLayout">
              {activeUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
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
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
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
                  <span className="text-sm">{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground ml-auto">(You)</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}