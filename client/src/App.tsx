import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { OnboardingProvider } from "@/providers/OnboardingProvider";

// Loading component with minimal footprint
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load route components
const Home = lazy(() => import("@/pages/Home"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DocManagePage = lazy(() => import("@/pages/DocManage"));

// Protected route wrapper with authentication check
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const isAuthenticated = true; // Replace with your auth logic
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...rest} />
    </Suspense>
  );
}

function App() {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background/95">
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background to-background/80" />

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <Switch>
            <Route path="/login">
              <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
              </Suspense>
            </Route>
            <Route path="/">
              <ProtectedRoute component={Home} />
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute component={DashboardPage} />
            </Route>
            <Route path="/chat/:id?">
              <ProtectedRoute component={ChatPage} />
            </Route>
            <Route path="/docmanage">
              <ProtectedRoute component={DocManagePage} />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

// Minimal 404 component
function NotFound() {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
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
      <ThemeProvider defaultTheme="system" enableSystem>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}