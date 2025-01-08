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

interface Message {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string | Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

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

  // Fetch existing chat data
  const { data: chat, error: chatError } = useQuery<Chat>({
    queryKey: ['/api/chats', chatId],
    enabled: !!chatId,
  });

  // Create new chat mutation
  const createChat = useMutation({
    mutationFn: async (content: string) => {
      console.log("Creating new chat with content:", content);
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to create chat:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to create chat: ${errorText}`);
      }

      const data = await response.json();
      console.log("Chat created successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/chats', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      console.log("Sending message:", { content, chatId });
      let targetChatId = chatId;

      // Create a new chat if we don't have one
      if (!targetChatId) {
        console.log("No chatId provided, creating new chat");
        const newChat = await createChat.mutateAsync(content);
        targetChatId = newChat.id;
        navigate(`/chat/${targetChatId}`);
        return newChat.messages;
      }

      // Send message to existing chat
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChatId,
          content,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send message:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to send message: ${errorText}`);
      }

      const data = await response.json();
      console.log("Message sent successfully:", data);
      return data;
    },
    onSuccess: (newMessages) => {
      // Update local messages immediately
      setLocalMessages(prev => [...prev, ...newMessages]);

      // Clear input and refresh data
      setInput("");

      // Invalidate queries to refresh data
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: (error: Error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      try {
        // Add user message to local state immediately
        const userMessage: Message = {
          id: Date.now(),
          role: 'user',
          content: input.trim(),
          createdAt: new Date().toISOString(),
        };
        setLocalMessages(prev => [...prev, userMessage]);

        await sendMessage.mutateAsync(input);
      } catch (error) {
        console.error("Error in handleSubmit:", error);
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages, localMessages]);

  const handleFileUpload = async (files: File[]) => {
    setShowFileUpload(false);
  };

  if (chatError) {
    console.error("Error loading chat:", chatError);
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          Error loading chat: {chatError.message}
        </div>
      </div>
    );
  }

  // Use local messages for immediate feedback, fall back to chat messages from server
  const messages = localMessages.length > 0 ? localMessages : (chat?.messages || []);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">GYM AI Engine</h1>
            <p className="text-muted-foreground">I'm here to help! Ask me anything.</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
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