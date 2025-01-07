import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import EquipmentList from "@/components/club/EquipmentList";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import DocumentControl from "@/pages/DocumentControl";
import DashboardPage from "@/pages/DashboardPage";

function App() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 pt-16">
            <AnimatePresence mode="wait">
              <Switch key={location}>
                <Route path="/">
                  <PageTransition>
                    <Home />
                  </PageTransition>
                </Route>
                <Route path="/dashboard">
                  <PageTransition>
                    <div data-tour="dashboard-section">
                      <DashboardPage />
                    </div>
                  </PageTransition>
                </Route>
                <Route path="/chat/:id?">
                  <PageTransition>
                    <div data-tour="chat-section">
                      <ChatPage />
                    </div>
                  </PageTransition>
                </Route>
                <Route path="/documents">
                  <PageTransition>
                    <div data-tour="document-section">
                      <DocumentControl />
                    </div>
                  </PageTransition>
                </Route>
                <Route path="/equipment">
                  <PageTransition>
                    <div data-tour="equipment-section">
                      <EquipmentList />
                    </div>
                  </PageTransition>
                </Route>
                <Route>
                  <NotFound />
                </Route>
              </Switch>
            </AnimatePresence>
          </main>
          <OnboardingTour />
          <Toaster />
        </div>
      </OnboardingProvider>
    </QueryClientProvider>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
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
    </div>
  );
}

export default App;