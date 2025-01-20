import React, { createContext, useContext, useState } from 'react';

type OnboardingContextType = {
  isOnboarded: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(() => {
    // Check local storage for onboarding status
    const saved = localStorage.getItem('onboarding-completed');
    return saved === 'true';
  });

  const completeOnboarding = () => {
    setIsOnboarded(true);
    localStorage.setItem('onboarding-completed', 'true');
  };

  const resetOnboarding = () => {
    setIsOnboarded(false);
    localStorage.setItem('onboarding-completed', 'false');
  };

  return (
    <OnboardingContext.Provider 
      value={{ 
        isOnboarded, 
        completeOnboarding, 
        resetOnboarding 
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
