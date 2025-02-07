import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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
  const { messages, addMessages, clearMessages } = useChatHistory(chatId);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            message: content, 
            history: messages.map(({ role, content }) => ({ role, content }))
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data || typeof data.response !== 'string') {
          throw new Error('Invalid response format from server');
        }

        return data.response;
      } finally {
        abortControllerRef.current = null;
      }
    },
    onSuccess: (response) => {
      addMessages([{ role: 'assistant', content: response, id: Date.now().toString() }]);
      setInput("");
    },
    onError: (error: Error) => {
      if (error.name !== 'AbortError') {
        toast({
          title: "Error",
          description: error.message || "Failed to get AI response",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const userMessage = { role: 'user' as const, content: input.trim(), id: Date.now().toString() };
    addMessages([userMessage]);

    try {
      await sendMessage.mutateAsync(input.trim());
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {showWelcome ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">NOMAD AI Engine</h1>
            <p className="text-muted-foreground">Ask me anything about manufacturing, operations, or facility management!</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}>
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-pulse">•</div>
                <div className="animate-pulse animation-delay-200">•</div>
                <div className="animate-pulse animation-delay-400">•</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about manufacturing, operations, or facility management..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          {sendMessage.isPending ? (
            <Button
              type="button"
              onClick={handleStop}
              variant="destructive"
              size="icon"
            >
              <FontAwesomeIcon icon={["fal", "square"]} className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <FontAwesomeIcon icon={["fal", "paper-plane"]} className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}