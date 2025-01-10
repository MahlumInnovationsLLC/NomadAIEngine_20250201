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
import { Loader2 } from "lucide-react";

export function OnlineUsersDropdown() {
  const { users, isLoading, error } = useAzureUsers();
  const [open, setOpen] = useState(false);

  // Count online users
  const onlineCount = users?.filter(user => user.presence.status === 'online').length || 0;

  // Sort users: online users first, then alphabetically by displayName
  const sortedUsers = users?.sort((a, b) => {
    // If one is online and other isn't, online comes first
    if (a.presence.status === 'online' && b.presence.status !== 'online') return -1;
    if (a.presence.status !== 'online' && b.presence.status === 'online') return 1;

    // If both have same status, sort alphabetically
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Users className="h-4 w-4" />
              {onlineCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-xs text-white flex items-center justify-center">
                  {onlineCount}
                </span>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Team Members</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading users...
          </DropdownMenuItem>
        ) : error ? (
          <DropdownMenuItem disabled className="text-destructive">
            Failed to load users
          </DropdownMenuItem>
        ) : !sortedUsers?.length ? (
          <DropdownMenuItem disabled>No users found</DropdownMenuItem>
        ) : (
          sortedUsers.map(user => (
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
                ) : "Offline"}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}