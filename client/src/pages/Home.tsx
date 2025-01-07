import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquarePlus } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to GYM AI Engine
        </h1>
        <p className="text-muted-foreground text-lg">
          Your intelligent assistant for document management and conversations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Start a Chat</h2>
          <p className="text-muted-foreground mb-6">
            Begin a new conversation with our AI assistant to get help, analyze documents, or generate reports.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/chat')}
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            New Chat
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-muted-foreground">
            Your recent chats and documents will appear here.
          </p>
        </Card>
      </div>
    </div>
  );
}
