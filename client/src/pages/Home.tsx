import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

export default function Home() {
  const [, navigate] = useLocation();
  const { startOnboarding, isFirstVisit } = useOnboarding();

  return (
    <div className="max-w-4xl mx-auto py-12 pt-20">
      <div className="text-center mb-12" data-tour="welcome-section">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to GYM AI Engine
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Your intelligent assistant for document management and conversations
        </p>
        {isFirstVisit && (
          <Button onClick={startOnboarding} size="lg" className="gap-2">
            <FontAwesomeIcon icon="play" className="h-4 w-4" />
            <FontAwesomeIcon icon="play" className="mr-2 h-4 w-4" />
            Start Platform Tour
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="p-6" data-tour="chat-section">
          <h2 className="text-2xl font-semibold mb-4">Start a Chat</h2>
          <p className="text-muted-foreground mb-6">
            Begin a new conversation with our AI assistant to get help, analyze documents, or generate reports.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/chat')}
          >
            <FontAwesomeIcon icon="message-plus" className="mr-2 h-5 w-5" />
            <FontAwesomeIcon icon="message-plus" className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Card>

        <Card className="p-6" data-tour="document-section">
          <h2 className="text-2xl font-semibold mb-4">Document Training & Control</h2>
          <p className="text-muted-foreground mb-6">
            Upload, manage, and train documents with advanced version control.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/documents')}
          >
            <FontAwesomeIcon icon="file-lines" className="mr-2 h-5 w-5" />
            Manage Documents
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground mb-6">
            View analytics, statistics, and key performance indicators for your gym.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            <FontAwesomeIcon icon="chart-mixed" className="mr-2 h-5 w-5" />
            Open Dashboard
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Club Control</h2>
          <p className="text-muted-foreground mb-6">
            Manage equipment, maintenance schedules, and facility operations.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/club-control')}
          >
            <FontAwesomeIcon icon="dumbbell" className="mr-2 h-5 w-5" />
            Club Control
          </Button>
        </Card>
      </div>
    </div>
  );
}