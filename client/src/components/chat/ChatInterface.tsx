import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, FileText } from "lucide-react";
import ChatMessage from "./ChatMessage";
import FileUpload from "../document/FileUpload";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@db/schema";

interface ChatInterfaceProps {
  chatId?: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', chatId],
    enabled: !!chatId,
  });

  // Create new chat mutation
  const createChat = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      return data;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      let targetChatId = chatId;

      // Create a new chat if we don't have one
      if (!targetChatId) {
        const newChat = await createChat.mutateAsync(content);
        targetChatId = String(newChat.id);
        navigate(`/chat/${targetChatId}`);
      }

      // Add message optimistically
      const optimisticMessage = {
        id: Date.now(),
        chatId: parseInt(targetChatId),
        role: 'user' as const,
        content,
        createdAt: new Date(),
      };
      setLocalMessages(prev => [...prev, optimisticMessage]);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: targetChatId, content }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Remove optimistic update and add real message
      setLocalMessages(prev => prev.filter(msg => msg.role === 'assistant'));
      setLocalMessages(prev => [...prev, data]);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });

      // Clear input after successful send
      setInput("");
    },
    onError: (error) => {
      // Remove optimistic update on error
      setLocalMessages(prev => prev.slice(0, -1));
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      try {
        await sendMessage.mutateAsync(input);
      } catch (error) {
        // Error is handled in the mutation's onError callback
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, localMessages]);

  const handleFileUpload = async (files: File[]) => {
    setShowFileUpload(false);
  };

  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {allMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">GYM AI Engine</h1>
            <p className="text-muted-foreground">I'm here to help! Ask me anything.</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {allMessages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            className="shrink-0"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
}