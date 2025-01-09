import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, FileText, Download } from "lucide-react";
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
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch existing chat data
  const { data: chat } = useQuery<Chat>({
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
        throw new Error(`Failed to create chat: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/chats', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setIsFirstMessage(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      console.log("Sending message:", { content, chatId });
      let targetChatId = chatId;

      // Create a new chat if we don't have one
      if (!targetChatId) {
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
        throw new Error(`Failed to send message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (newMessages) => {
      setInput("");
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await sendMessage.mutateAsync(input);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  // Show welcome screen only on first message
  const showWelcome = isFirstMessage && (!chat?.messages || chat.messages.length === 0);

  const handleFileUpload = async (files: File[]) => {
    setShowFileUpload(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {showWelcome ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">GYM AI Engine</h1>
            <p className="text-muted-foreground">I'm here to help! Ask me anything.</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {chat?.messages.map((message) => (
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
          {chat?.messages && chat.messages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => generateReport.mutate()}
              disabled={generateReport.isPending}
              className="shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
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