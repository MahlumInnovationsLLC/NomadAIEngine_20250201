import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AnimatePresenceWrapper, AnimateTransition } from "@/components/ui/AnimateTransition";
import Navbar from "@/components/layout/Navbar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ModuleSelector } from "@/components/layout/ModuleSelector";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./lib/msal-config";
import { useToast } from "@/hooks/use-toast";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import ClubControlPage from "@/pages/ClubControlPage";
import LoginPage from "@/pages/LoginPage";
import { DocManage } from "@/pages/DocManage";
import TrainingModule from "@/pages/TrainingModule";
import React from 'react';
import { OnlineUsersDropdown } from "@/components/ui/online-users-dropdown";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const msalInstance = new PublicClientApplication(msalConfig);

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const isAuthenticated = useIsAuthenticated();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <ErrorBoundary>
      <AnimateTransition variant="fade">
        <Component {...rest} />
      </AnimateTransition>
    </ErrorBoundary>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const { toast } = useToast();

  const currentPath = location?.split('/')[1] || '';
  const showModuleSelector = currentPath === 'docmanage';

  React.useEffect(() => {
    if (location === '/docmanage') {
      setLocation('/docmanage/docmanagement');
    }
  }, [location, setLocation]);

  const handleLogout = React.useCallback(() => {
    instance
      .logoutPopup()
      .then(() => {
        setLocation("/login");
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
        });
      })
      .catch((error) => {
        console.error('Logout error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to log out. Please try again.",
        });
      });
  }, [instance, setLocation, toast]);

  if (!isAuthenticated && currentPath !== 'login') {
    return (
      <AnimateTransition variant="fade">
        <LoginPage />
      </AnimateTransition>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background/95">
      <div className="absolute inset-0 -z-20 bg-red-50/90" />
      <ErrorBoundary>
        <ParticleBackground className="absolute inset-0 -z-10" particleColor="rgba(239, 68, 68, 0.2)" />
      </ErrorBoundary>

      {isAuthenticated && (
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar onLogout={handleLogout} />
        </div>
      )}

      <main className="flex-1 pt-6 relative z-10">
        <div className="container mx-auto">
          <div className="flex gap-4">
            {showModuleSelector && isAuthenticated && (
              <AnimateTransition variant="slide-right" delay={0.2}>
                <ModuleSelector 
                  activeModule={location.includes('training') ? 'training' : 'docmanagement'} 
                  onModuleChange={(moduleId) => {
                    setLocation(`/docmanage/${moduleId}`);
                  }}
                />
              </AnimateTransition>
            )}
            <div className={`${showModuleSelector ? 'flex-1' : 'w-full'}`}>
              <AnimatePresenceWrapper>
                <Switch>
                  <Route path="/login" component={LoginPage} />
                  <Route path="/" component={() => <ProtectedRoute component={Home} />} />
                  <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
                  <Route path="/chat/:id?" component={() => <ProtectedRoute component={ChatPage} />} />
                  <Route path="/docmanage/docmanagement" component={() => <ProtectedRoute component={DocManage} />} />
                  <Route path="/docmanage/training" component={() => <ProtectedRoute component={TrainingModule} />} />
                  <Route path="/club-control" component={() => <ProtectedRoute component={ClubControlPage} />} />
                  <Route component={NotFound} />
                </Switch>
              </AnimatePresenceWrapper>
            </div>
          </div>
        </div>
      </main>
      <OnboardingTour />
      <Toaster />
    </div>
  );
}

function NotFound() {
  return (
    <AnimateTransition variant="slide-up">
      <Card className="w-full max-w-md mx-4 mt-8">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </AnimateTransition>
  );
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <OnboardingProvider>
              <App />
            </OnboardingProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </MsalProvider>
    </ErrorBoundary>
  );
}