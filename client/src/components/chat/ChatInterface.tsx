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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const chat = await response.json();
      navigate(`/chat/${chat.id}`);
      return chat;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      let targetChatId = chatId;
      if (!targetChatId) {
        // Create a new chat if we don't have one
        const chat = await createChat.mutateAsync(content);
        targetChatId = chat.id.toString();
      }

      // Save user message
      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content,
        createdAt: new Date(),
        chatId: parseInt(targetChatId),
      };
      setLocalMessages(prev => [...prev, userMessage]);
      setInput(""); // Clear input immediately after sending

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: targetChatId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setLocalMessages(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      if (!chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage.mutate(input);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, localMessages]);

  const handleFileUpload = async (files: File[]) => {
    setShowFileUpload(false);
  };

  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] relative">
      {allMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">GYM AI Engine</h1>
            <p className="text-muted-foreground">I'm here to help! Ask me anything.</p>
          </div>
        </div>
      ) : (
        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 px-4 py-4"
        >
          <div className="space-y-4">
            {allMessages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="border-t bg-background p-4">
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