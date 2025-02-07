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
import ReactMarkdown from 'react-markdown';
import type { Message, ChatMode } from "@/types/chat";
import FileUpload from "../document/FileUpload";

interface ChatInterfaceProps {
  chatId?: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { messages, addMessages, clearMessages } = useChatHistory(chatId);

  const getFormattedHistory = () => {
    const history: Message[] = [];
    const chatMessages = messages.filter(msg => msg.role !== "system");

    for (let i = 0; i < chatMessages.length; i++) {
      const currentMsg = chatMessages[i];
      const prevMsg = history[history.length - 1];

      if (prevMsg && prevMsg.role === currentMsg.role) continue;

      if (!prevMsg || 
          (prevMsg.role === "user" && currentMsg.role === "assistant") ||
          (prevMsg.role === "assistant" && currentMsg.role === "user")) {
        history.push(currentMsg);
      }
    }

    return history;
  };

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const endpoint = mode === 'web-search' ? '/api/ai/web-search' : '/api/ai/chat';
        const history = getFormattedHistory();

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            message: content, 
            history: history.map(({ role, content }) => ({ role, content }))
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
      addMessages([{ 
        role: 'assistant', 
        content: response, 
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }]);
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
    if (!input.trim() || sendMessage.isPending || isAnalyzing) return;

    const userMessage = { 
      role: 'user' as const, 
      content: input.trim(), 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
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

  const handleFileUpload = async (files: File[]) => {
    setShowFileUpload(false);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();

      addMessages([
        { 
          role: 'system', 
          content: `Analyzing document${files.length > 1 ? 's' : ''}: ${files.map(f => f.name).join(', ')}`, 
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        },
        { 
          role: 'assistant', 
          content: data.analysis, 
          id: (Date.now() + 1).toString(),
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Error",
        description: "Failed to analyze document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
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
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted prose prose-sm dark:prose-invert"
                }`}>
                  {mode === 'web-search' && message.role === 'assistant' ? (
                    <ReactMarkdown 
                      className="space-y-4"
                      components={{
                        a: ({ node, ...props }) => (
                          <a 
                            {...props} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-4 leading-relaxed" />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="list-disc pl-4 mb-4 space-y-1" />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="mb-1" />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr {...props} className="my-4 border-muted-foreground/20" />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong {...props} className="font-semibold text-primary" />
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {(sendMessage.isPending || isAnalyzing) && (
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
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={mode === 'web-search'}
            onCheckedChange={(checked) => setMode(checked ? 'web-search' : 'chat')}
            id="mode-toggle"
          />
          <Label htmlFor="mode-toggle" className="flex items-center gap-2">
            <FontAwesomeIcon 
              icon={mode === 'web-search' ? ["fal", "globe"] : ["fal", "brain-circuit"]} 
              className="h-4 w-4 text-muted-foreground"
            />
            {mode === 'web-search' ? 'Web Search' : 'AI Engine Chat'}
          </Label>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            disabled={isAnalyzing || mode === 'web-search'}
            className="shrink-0"
          >
            <FontAwesomeIcon icon={["fal", "file-lines"]} className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'web-search' 
              ? "Search the web for manufacturing insights..." 
              : "Ask about manufacturing, operations, or facility management..."
            }
            className="flex-1"
            disabled={sendMessage.isPending || isAnalyzing}
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
              disabled={!input.trim() || sendMessage.isPending || isAnalyzing}
              className="bg-primary hover:bg-primary/90"
            >
              <FontAwesomeIcon icon={["fal", "paper-plane"]} className="h-4 w-4" />
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