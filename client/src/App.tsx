import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, LogOut } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AnimatePresenceWrapper, AnimateTransition } from "@/components/ui/AnimateTransition";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./lib/msal-config";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OnlineUsersDropdown } from "@/components/ui/online-users-dropdown";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Navbar from "@/components/layout/Navbar";

// Lazy load route components
const Home = lazy(() => import("@/pages/Home"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ClubControlPage = lazy(() => import("@/pages/ClubControlPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DocManage = lazy(() => import("@/pages/DocManage"));
const TrainingModule = lazy(() => import("@/pages/TrainingModule"));

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const isAuthenticated = useIsAuthenticated();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <AnimateTransition variant="fade">
          <Component {...rest} />
        </AnimateTransition>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthenticated = useIsAuthenticated();

  // Extract the current path from location
  const pathSegments = location.split('/');
  const currentPath = pathSegments[1] || '';
  const showModuleSelector = currentPath === 'docmanage';

  if (!isAuthenticated && currentPath !== 'login') {
    return (
      <AnimateTransition variant="fade">
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage />
        </Suspense>
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
          <NavbarWithAuth />
        </div>
      )}
      <main className="flex-1 pt-6 relative z-10">
        <div className="container mx-auto">
          <div className="flex gap-4">
            <div className={`${showModuleSelector ? 'flex-1' : 'w-full'}`}>
              <AnimatePresenceWrapper>
                <Suspense fallback={<LoadingFallback />}>
                  <Switch>
                    <Route path="/login" component={LoginPage} />
                    <Route path="/" component={() => <ProtectedRoute component={Home} />} />
                    <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
                    <Route path="/chat/:id?" component={() => <ProtectedRoute component={ChatPage} />} />
                    <Route path="/docmanage" component={() => <ProtectedRoute component={DocManage} />} />
                    <Route path="/docmanage/training" component={() => <ProtectedRoute component={DocManage} />} />
                    <Route path="/club-control" component={() => <ProtectedRoute component={ClubControlPage} />} />
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
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
    <AnimateTransition variant="slide-down" delay={0.1}>
      <div className="container flex h-14 items-center">
        <Navbar />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <OnlineUsersDropdown />
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