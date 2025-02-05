
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AISalesChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/sales-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history: messages })
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setMessages(prev => [
        ...prev,
        { role: "user", content: `Analyzing document: ${file.name}` },
        { role: "assistant", content: result.analysis }
      ]);
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: "Error",
        description: "Failed to analyze document",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FontAwesomeIcon icon="robot" className="text-primary h-5 w-5" />
          Sales AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Ask me anything about sales strategies, market insights, or deal analysis! You can also upload documents for analysis.
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn("h-8 w-8", msg.role === "user" ? "bg-primary" : "bg-muted")}>
                  <AvatarFallback>
                    <FontAwesomeIcon 
                      icon={msg.role === "user" ? "user" : "robot"} 
                      className={cn(
                        "h-4 w-4",
                        msg.role === "user" ? "text-primary-foreground" : "text-foreground"
                      )} 
                    />
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {(isLoading || isAnalyzing) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-pulse">•</div>
                <div className="animate-pulse animation-delay-200">•</div>
                <div className="animate-pulse animation-delay-400">•</div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Input
            type="file"
            onChange={handleFileUpload}
            className="max-w-[150px]"
            accept=".pdf,.doc,.docx,.txt"
            disabled={isAnalyzing || isLoading}
          />
          <form onSubmit={sendMessage} className="flex gap-2 flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales strategies, deal analysis, or market insights..."
              disabled={isLoading || isAnalyzing}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || isAnalyzing || !input.trim()}>
              <FontAwesomeIcon 
                icon="paper-plane" 
                className={cn(
                  "h-4 w-4",
                  isLoading && "animate-pulse"
                )} 
              />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
