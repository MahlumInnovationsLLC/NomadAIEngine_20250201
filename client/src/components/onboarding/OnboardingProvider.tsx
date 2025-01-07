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
        description: "You're all set to start using the platform.",
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
    title: "Welcome to GYM AI Engine",
    description: "Let's take a quick tour of the platform's features.",
    target: "welcome-section",
  },
  {
    title: "Start a Chat",
    description: "Begin conversations with our AI assistant to get help with your documents.",
    target: "chat-section",
  },
  {
    title: "Document Management",
    description: "Upload, manage, and train documents with advanced version control.",
    target: "document-section",
  },
  {
    title: "Workflow Templates",
    description: "Create and manage custom document workflows for your team.",
    target: "workflow-section",
  },
  {
    title: "Search Documents",
    description: "Use our powerful AI-powered search to find content across your documents.",
    target: "search-section",
  },
];
