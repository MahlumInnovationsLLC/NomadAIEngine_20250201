import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ModuleSelector } from "@/components/layout/ModuleSelector";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { MsalProvider, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./lib/msal-config";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import ClubControlPage from "@/pages/ClubControlPage";
import LoginPage from "@/pages/LoginPage";
import { DocManage } from "@/pages/DocManage";
import TrainingModule from "@/pages/TrainingModule";
import React, { useEffect } from 'react';

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

function App() {
  const [location, setLocation] = useLocation();
  const isAuthenticated = useIsAuthenticated();

  const currentPath = location?.split('/')[1] || '';
  const showModuleSelector = currentPath === 'docmanage';

  // Handle default routing to DocManagement when accessing /docmanage
  useEffect(() => {
    if (location === '/docmanage') {
      setLocation('/docmanage/docmanagement');
    }
  }, [location, setLocation]);

  if (!isAuthenticated && currentPath !== 'login') {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && (
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar />
        </div>
      )}
      <main className="container mx-auto pt-4">
        <div className="flex gap-4">
          {showModuleSelector && isAuthenticated && (
            <ModuleSelector 
              activeModule={location.includes('training') ? 'training' : 'docmanagement'} 
              onModuleChange={(moduleId) => {
                setLocation(`/docmanage/${moduleId}`);
              }}
            />
          )}
          <div className={`${showModuleSelector ? 'flex-1' : 'w-full'}`}>
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
          </div>
        </div>
      </main>
      <OnboardingTour />
    </div>
  );
}

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
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </MsalProvider>
  );
}