import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface ChatItem {
  id: string;
  title: string;
  lastMessageAt: string;
  isArchived: boolean;
}

export default function ChatHistorySidebar() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: chats, isLoading, error } = useQuery<ChatItem[]>({
    queryKey: ['/api/chats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/chats');
        if (!response.ok) {
          throw new Error(await response.text());
        }
        return response.json();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch chats');
      }
    }
  });

  const filteredChats = chats?.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(search.toLowerCase());
    const matchesArchiveFilter = showArchived ? chat.isArchived : !chat.isArchived;
    return matchesSearch && matchesArchiveFilter;
  });

  return (
    <div className="w-64 border-r h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <div className="relative">
          <FontAwesomeIcon icon="magnifying-glass" className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button
          variant={showArchived ? "outline" : "ghost"}
          size="sm"
          onClick={() => setShowArchived(false)}
          className="flex-1"
        >
          <FontAwesomeIcon icon="message" className="h-4 w-4 mr-2" />
          Active
        </Button>
        <Button
          variant={showArchived ? "ghost" : "outline"}
          size="sm"
          onClick={() => setShowArchived(true)}
          className="flex-1"
        >
          <FontAwesomeIcon icon="box-archive" className="h-4 w-4 mr-2" />
          Archived
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {error ? (
          <Alert variant="destructive" className="m-4">
            <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredChats?.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            {search ? "No chats found" : showArchived ? "No archived chats" : "No active chats"}
          </div>
        ) : (
          <div className="py-2">
            {filteredChats?.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className={cn(
                  "w-full text-left px-4 py-2 hover:bg-accent/50 text-sm",
                  "focus:outline-none focus:bg-accent"
                )}
              >
                <div className="font-medium truncate">{chat.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(chat.lastMessageAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}