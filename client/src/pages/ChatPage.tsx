import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { Chat } from "@db/schema";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id?");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
  });

  // Fetch current chat if ID exists
  const { data: currentChat } = useQuery<Chat>({
    queryKey: ['/api/chats', params?.id],
    enabled: !!params?.id,
  });

  // Delete chat mutation
  const deleteChat = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      return response.json();
    },
    onSuccess: (_, deletedChatId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      if (params?.id === deletedChatId) {
        navigate('/chat');
      }
      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    },
  });

  const handleNewChat = () => {
    navigate('/chat');
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChat.mutate(chatId);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r p-4">
        <Button
          onClick={handleNewChat}
          className="mb-4"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <div className="flex-1 overflow-auto space-y-2">
          {chats.map((chat) => (
            <div 
              key={chat.id}
              className="flex items-center group hover:bg-accent rounded-lg p-2 cursor-pointer"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <span className="flex-1 truncate text-sm text-foreground">
                {chat.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={(e) => handleDeleteChat(chat.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        <ChatInterface chatId={params?.id} />
      </div>
    </div>
  );
}