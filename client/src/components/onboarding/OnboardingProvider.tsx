import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface OnboardingContextType {
  isFirstVisit: boolean;
  currentStep: number;
  showOnboarding: boolean;
  completeStep: () => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    if (!hasCompletedOnboarding) {
      setIsFirstVisit(true);
      setShowOnboarding(true);
    }
  }, []);

  const completeStep = () => {
    if (currentStep === onboardingSteps.length - 1) {
      localStorage.setItem('onboardingCompleted', 'true');
      setShowOnboarding(false);
      toast({
        title: "Welcome aboard! 🎉",
        description: "You're all set to start using the Nomad AI Engine platform.",
      });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentStep(0);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
    toast({
      title: "Onboarding skipped",
      description: "You can always restart the tour from the settings menu.",
    });
  };

  return (
    <OnboardingContext.Provider
      value={{
        isFirstVisit,
        currentStep,
        showOnboarding,
        completeStep,
        startOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const onboardingSteps = [
  {
    title: "Welcome to Nomad AI Engine",
    description: "Let's explore your intelligent assistant for Sales and Manufacturing management.",
    target: "welcome-section",
  },
  {
    title: "Sales Control",
    description: "Manage your sales pipeline, track deals, and optimize your sales process with AI-powered insights.",
    target: "sales-section",
  },
  {
    title: "Manufacturing Control",
    description: "Monitor production lines, manage quality control, and optimize manufacturing processes with real-time analytics.",
    target: "manufacturing-section",
  },
  {
    title: "Material Handling",
    description: "Track inventory, manage materials, and optimize your supply chain operations efficiently.",
    target: "material-section",
  },
  {
    title: "Marketing Control",
    description: "Create and manage marketing campaigns, track performance metrics, and optimize your marketing strategy.",
    target: "marketing-section",
  },
  {
    title: "Document Management",
    description: "Centralize your document control with advanced version tracking, training materials, and SOPs.",
    target: "document-section",
  },
  {
    title: "AI Assistant",
    description: "Get intelligent help with data analysis, report generation, and process optimization.",
    target: "chat-section",
  },
];