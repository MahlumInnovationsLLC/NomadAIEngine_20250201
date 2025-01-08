import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Pencil, Check } from "lucide-react";
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

  const handleNewChat = () => {
    navigate('/chat');
  };

  const handleTitleSubmit = (chatId: number, newTitle: string) => {
    updateChatTitle.mutate({ id: chatId, title: newTitle });
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
              {editingTitle === String(chat.id) ? (
                <form 
                  className="flex-1 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem('title') as HTMLInputElement;
                    handleTitleSubmit(chat.id, input.value);
                  }}
                >
                  <Input 
                    name="title"
                    defaultValue={chat.title}
                    autoFocus
                    onBlur={(e) => handleTitleSubmit(chat.id, e.target.value)}
                  />
                  <Button type="submit" size="sm" variant="ghost">
                    <Check className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 truncate">{chat.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitle(String(chat.id));
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {currentChat && (
          <div className="border-b p-4 flex items-center gap-2">
            {editingTitle === String(currentChat.id) ? (
              <form 
                className="flex-1 flex gap-2"
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
                />
                <Button type="submit" size="sm" variant="ghost">
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <h1 className="text-lg font-semibold flex-1">{currentChat.title}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTitle(String(currentChat.id))}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
        <ChatInterface chatId={params?.id} />
      </div>
    </div>
  );
}