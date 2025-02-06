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
          Welcome to Nomad AI Engine
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Your intelligent assistant for Sales and Manufacturing management
        </p>
        {isFirstVisit && (
          <Button onClick={startOnboarding} size="lg" className="gap-2">
            <FontAwesomeIcon icon={['fal', 'play']} className="mr-2 h-4 w-4" />
            Start Platform Tour
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6" data-tour="sales-section">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'chart-line']} className="h-5 w-5" />
            Sales Control
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage sales pipelines, track deals, and optimize your sales process with AI-powered insights.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/sales-control')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Sales Control
          </Button>
        </Card>

        <Card className="p-6" data-tour="manufacturing-section">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'industry']} className="h-5 w-5" />
            Manufacturing Control
          </h2>
          <p className="text-muted-foreground mb-6">
            Monitor production lines, manage quality control, and optimize manufacturing processes.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/manufacturing-control')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Manufacturing
          </Button>
        </Card>

        <Card className="p-6" data-tour="material-section">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'boxes-stacked']} className="h-5 w-5" />
            Material Handling
          </h2>
          <p className="text-muted-foreground mb-6">
            Track inventory, manage materials, and optimize supply chain operations.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/material-handling')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Material Handling
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'bullhorn']} className="h-5 w-5" />
            Marketing Control
          </h2>
          <p className="text-muted-foreground mb-6">
            Create and manage marketing campaigns, emails, and track campaign performance.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/marketing-control')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Marketing Control
          </Button>
        </Card>

        <Card className="p-6" data-tour="document-section">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'file-lines']} className="h-5 w-5" />
            Document Management
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage training documents, SOPs, and quality control documentation.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/docmanage')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Documents
          </Button>
        </Card>

        <Card className="p-6" data-tour="chat-section">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'message']} className="h-5 w-5" />
            AI Assistant
          </h2>
          <p className="text-muted-foreground mb-6">
            Get help, analyze data, and generate reports with our AI assistant.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/chat')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Start Chat
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'file-lines']} className="h-5 w-5" />
            Document Control
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage training documents, SOPs, and quality control documentation.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/docmanage')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Documents
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'wrench']} className="h-5 w-5" />
            Field Service
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage service tickets, technicians, and field operations.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/field-service')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Field Service
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'building']} className="h-5 w-5" />
            Club Control
          </h2>
          <p className="text-muted-foreground mb-6">
            Manage facility maintenance, equipment, and club operations.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/club-control')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Club Control
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fal', 'boxes-stacked']} className="h-5 w-5" />
            Material Handling
          </h2>
          <p className="text-muted-foreground mb-6">
            Track inventory, manage materials, and optimize supply chain operations.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/material-handling')}
          >
            <FontAwesomeIcon icon={['fal', 'arrow-right']} className="mr-2 h-5 w-5" />
            Open Material Handling
          </Button>
        </Card>

      </div>
    </div>
  );
}