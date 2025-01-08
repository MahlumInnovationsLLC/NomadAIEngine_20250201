import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Check, Trash2 } from "lucide-react";
import type { Chat } from "@db/schema";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id?");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
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

  // Update chat title mutation
  const updateChatTitle = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setEditingTitle(null);
      toast({
        title: "Success",
        description: "Chat title updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      });
    },
  });

  // Delete chat mutation
  const deleteChat = useMutation({
    mutationFn: async (chatId: number) => {
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
      if (parseInt(params?.id || '0') === deletedChatId) {
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

  const handleTitleSubmit = (chatId: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    updateChatTitle.mutate({ id: chatId, title: newTitle });
  };

  const handleDeleteChat = (chatId: number, e: React.MouseEvent) => {
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
              <span className="flex-1 truncate">{chat.title}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTitle(String(chat.id));
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Title Header */}
        {currentChat && (
          <div className="p-6 bg-background border-b">
            {editingTitle === String(currentChat.id) ? (
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('title') as HTMLInputElement;
                  handleTitleSubmit(currentChat.id, input.value);
                }}
              >
                <Input 
                  name="title"
                  defaultValue={currentChat.title}
                  autoFocus
                  onBlur={(e) => handleTitleSubmit(currentChat.id, e.target.value)}
                  className="text-2xl font-semibold"
                />
                <Button type="submit" size="sm" variant="ghost">
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{currentChat.title}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTitle(String(currentChat.id))}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <ChatInterface chatId={params?.id} />
      </div>
    </div>
  );
}