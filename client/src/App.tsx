import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Loading component with minimal footprint
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load route components with granular splitting
const Home = lazy(() => import("@/pages/Home"));
const ChatPage = lazy(() =>
  import("@/pages/ChatPage").then((module) => ({
    default: module.default,
  }))
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((module) => ({
    default: module.default,
  }))
);
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
          <Suspense fallback={<LoadingFallback />}>
            <Switch>
              <Route path="/login" component={LoginPage} />
              <Route path="/" component={() => <ProtectedRoute component={Home} />} />
              <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
              <Route path="/chat/:id?" component={() => <ProtectedRoute component={ChatPage} />} />
              <Route path="/docmanage" component={() => <ProtectedRoute component={DocManagePage} />} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
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
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  );
}