import { Switch, Route, useLocation } from "wouter";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, LogOut } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ModuleSelector } from "@/components/layout/ModuleSelector";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { UserPresence } from "@/components/ui/UserPresence";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./lib/msal-config";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import { DocManagement } from "@/pages/DocManagement";
import DashboardPage from "@/pages/DashboardPage";
import ClubControlPage from "@/pages/ClubControlPage";
import DocumentExplorer from "@/pages/DocumentExplorer";
import TrainingModule from "@/pages/TrainingModule";
import LoginPage from "@/pages/LoginPage";
import React from 'react';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const isAuthenticated = useIsAuthenticated();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component {...rest} />;
}

function NavbarWithAuth() {
  const { instance } = useMsal();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
      setLocation("/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <div className="container flex h-14 items-center">
      <Navbar />
      <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <NotificationCenter />
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthenticated = useIsAuthenticated();

  // Safely get the current path, defaulting to empty string if undefined
  const currentPath = location?.split('/')[1] || '';

  // Only show ModuleSelector in document training & control section
  const showModuleSelector = ['documents', 'docmanagement', 'training'].includes(currentPath);

  // For demo purposes, using a hardcoded user ID
  const userId = "1";

  // If user is not authenticated and not on login page, don't render anything
  // The ProtectedRoute component will handle the redirect
  if (!isAuthenticated && currentPath !== 'login') {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && (
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <NavbarWithAuth />
        </div>
      )}
      <main className="container mx-auto pt-4">
        <div className="flex gap-4">
          {showModuleSelector && isAuthenticated && (
            <ModuleSelector 
              activeModule={currentPath || 'documents'} 
              onModuleChange={(moduleId) => {
                window.location.href = `/${moduleId}`;
              }}
            />
          )}
          <div className={`${showModuleSelector ? 'flex-1' : 'w-full'}`}>
            <AnimatePresence mode="wait">
              <Switch key={location}>
                <Route path="/login" component={LoginPage} />
                <Route path="/" component={() => <ProtectedRoute component={Home} />} />
                <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
                <Route path="/chat/:id?" component={() => <ProtectedRoute component={ChatPage} />} />
                <Route path="/documents" component={() => <ProtectedRoute component={DocumentExplorer} />} />
                <Route path="/docmanagement" component={() => <ProtectedRoute component={DocManagement} />} />
                <Route path="/training" component={() => <ProtectedRoute component={TrainingModule} />} />
                <Route path="/club-control" component={() => <ProtectedRoute component={ClubControlPage} />} />
                <Route component={NotFound} />
              </Switch>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <UserPresence currentUserId={userId} />
      <OnboardingTour />
      <Toaster />
    </div>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
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
  );
}

export default function AppWrapper() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" enableSystem>
          <OnboardingProvider>
            <App />
          </OnboardingProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}