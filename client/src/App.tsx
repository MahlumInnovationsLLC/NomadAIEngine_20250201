import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import DocumentControl from "@/pages/DocumentControl";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

function App() {
  const [location] = useLocation();

  return (
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
              <Route>
                <PageTransition>
                  <div className="flex items-center justify-center h-[60vh]">
                    <h1 className="text-2xl font-bold">404 Not Found</h1>
                  </div>
                </PageTransition>
              </Route>
            </Switch>
          </AnimatePresence>
        </main>
        <OnboardingTour />
        <Toaster />
      </div>
    </OnboardingProvider>
  );
}

export default App;