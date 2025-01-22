import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import ChatMessage from "./ChatMessage";
import FileUpload from "../document/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { useChatHistory } from "@/hooks/use-chat-history";
import type { Message, ChatMode } from "@/types/chat";

interface ChatInterfaceProps {
  chatId?: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use the chat history hook instead of local state
  const { messages, addMessages, clearMessages } = useChatHistory(chatId);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      try {
        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, mode }),
          signal: abortControllerRef.current.signal,
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send message: ${errorText}`);
        }

        return response.json();
      } finally {
        // Clear the abort controller after the request completes or fails
        abortControllerRef.current = null;
      }
    },
    onSuccess: (newMessages: Message[]) => {
      setInput("");
      addMessages(newMessages);
    },
    onError: (error: Error) => {
      // Only show error toast if it's not an abort error
      if (error.name !== 'AbortError') {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFileUpload = async (files: File[]) => {
    setShowFileUpload(false);
  };

  const showWelcome = messages.length === 0;

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
            {messages.map((message, index) => (
              <div key={`${message.id}-${index}`} className="relative">
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  citations={message.citations}
                />
                {message.role === 'assistant' && index === messages.length - 1 && sendMessage.isPending && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-background/50">
                    <FontAwesomeIcon icon="rotate" className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      <div className="border-t p-4 bg-background">
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={mode === 'web-search'}
            onCheckedChange={(checked) => setMode(checked ? 'web-search' : 'chat')}
            id="mode-toggle"
          />
          <Label htmlFor="mode-toggle" className="flex items-center gap-2">
            <FontAwesomeIcon 
              icon={mode === 'web-search' ? "globe" : "message"} 
              className="h-4 w-4 text-muted-foreground"
            />
            {mode === 'web-search' ? 'Web Search' : 'Chat'}
          </Label>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            className="shrink-0"
          >
            <FontAwesomeIcon icon="file-lines" className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'web-search' ? "Search the web..." : "Type your message..."}
            className="flex-1"
          />
          {sendMessage.isPending ? (
            <Button
              type="button"
              onClick={handleStop}
              variant="destructive"
              size="icon"
              className="aspect-square"
            >
              <FontAwesomeIcon icon="square" className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <FontAwesomeIcon icon="paper-plane" className="h-4 w-4" />
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