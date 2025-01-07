import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import ChatPage from "@/pages/ChatPage";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const [location] = useLocation();

  return (
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
                <ChatPage />
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
      <Toaster />
    </div>
  );
}

export default App;