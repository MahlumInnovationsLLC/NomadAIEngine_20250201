import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, FileText } from "lucide-react";
import ChatMessage from "./ChatMessage";
import FileUpload from "../document/FileUpload";

interface ChatInterfaceProps {
  chatId?: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  files?: any[];
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', chatId],
    enabled: !!chatId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // First add the user message locally
      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content,
      };
      setLocalMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send message');
      return data;
    },
    onSuccess: (data) => {
      setLocalMessages(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      setInput("");
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
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
  }, [localMessages]);

  const handleFileUpload = async (files: File[]) => {
    // Handle file upload logic here
    setShowFileUpload(false);
  };

  const allMessages = [...localMessages];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {allMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">GYM AI Engine</h1>
            <p className="text-muted-foreground">I'm here to help! Ask me anything.</p>
          </div>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {allMessages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            files={message.files}
          />
        ))}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
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
        </div>
      </form>

      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
}