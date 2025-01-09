import { Switch, Route, useLocation } from "wouter";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
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
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import { DocManagement } from "@/pages/DocManagement";
import DashboardPage from "@/pages/DashboardPage";
import ClubControlPage from "@/pages/ClubControlPage";
import DocumentExplorer from "@/pages/DocumentExplorer";
import TrainingModule from "@/pages/TrainingModule";

function App() {
  const [location] = useLocation();
  // Safely get the current path, defaulting to empty string if undefined
  const currentPath = location?.split('/')[1] || '';

  // Only show ModuleSelector in document training & control section
  const showModuleSelector = ['documents', 'docmanagement', 'training'].includes(currentPath);

  // For demo purposes, using a hardcoded user ID
  const userId = "1";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Navbar />
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <NotificationCenter />
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 pt-8">
        <div className="flex gap-4">
          {showModuleSelector && (
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
                <Route path="/" component={Home} />
                <Route path="/dashboard" component={DashboardPage} />
                <Route path="/chat/:id?" component={ChatPage} />
                <Route path="/documents" component={DocumentExplorer} />
                <Route path="/docmanagement" component={DocManagement} />
                <Route path="/training" component={TrainingModule} />
                <Route path="/club-control" component={ClubControlPage} />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}