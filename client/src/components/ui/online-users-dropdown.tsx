import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useAzureUsers } from "@/hooks/use-azure-users";
import { PresenceIndicator } from "@/components/ui/presence-indicator";
import { format } from "date-fns";

export function OnlineUsersDropdown() {
  const { users, isLoading } = useAzureUsers();
  const [open, setOpen] = useState(false);

  // Count online users
  const onlineCount = users?.filter(user => user.presence.status === 'online').length || 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Users className="h-4 w-4" />
          {onlineCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-xs text-white flex items-center justify-center">
              {onlineCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Online Users</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>Loading users...</DropdownMenuItem>
        ) : !users?.length ? (
          <DropdownMenuItem disabled>No users found</DropdownMenuItem>
        ) : (
          users.map(user => (
            <DropdownMenuItem key={user.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <PresenceIndicator status={user.presence.status} size="sm" />
                <span className="text-sm">{user.displayName}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {user.presence.status === 'online' ? (
                  "Online now"
                ) : user.presence.lastSeen ? (
                  <span className="italic">
                    {format(new Date(user.presence.lastSeen), 'h:mm a')}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
