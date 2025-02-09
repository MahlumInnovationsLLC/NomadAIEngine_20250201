import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AnimatePresenceWrapper } from "@/components/ui/AnimateTransition";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import Navbar from "@/components/layout/Navbar";

// Lazy load route components with error boundaries
const Home = lazy(() => import("./pages/Home"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ManufacturingControlPage = lazy(() => import("./pages/ManufacturingControlPage"));
const MarketingControl = lazy(() => import("./pages/MarketingControl"));
const MaterialHandling = lazy(() => import("./components/material/MaterialDashboard"));
const SalesControl = lazy(() => import("./pages/SalesControl"));
const FacilityControlPage = lazy(() => import("./pages/FacilityControlPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DocumentManagementPage = lazy(() => import("./pages/DocumentManagement"));
const FieldServiceDashboard = lazy(() => import("./components/field-service/FieldServiceDashboard"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function App() {
  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col overflow-auto">
      <div className="fixed inset-0 -z-20 w-full h-full">
        <ParticleBackground className="absolute inset-0 w-full h-full" particleColor="rgba(239, 68, 68, 0.2)" />
        <div className="absolute inset-0 w-full h-full bg-background/90" />
      </div>

      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar />
        </div>

        <main className="flex-1 pt-6 relative z-10">
          <div className="container mx-auto">
            <AnimatePresenceWrapper>
              <Suspense fallback={<LoadingFallback />}>
                <Switch>
                  <Route path="/" component={DashboardPage} />
                  <Route path="/dashboard" component={DashboardPage} />
                  <Route path="/chat/:id?" component={ChatPage} />
                  <Route path="/manufacturing-control" component={ManufacturingControlPage} />
                  <Route path="/sales-control" component={SalesControl} />
                  <Route path="/marketing-control" component={MarketingControl} />
                  <Route path="/material-handling" component={MaterialHandling} />
                  <Route path="/facility-control" component={FacilityControlPage} />
                  <Route path="/field-service" component={FieldServiceDashboard} />
                  <Route path="/docmanage" component={DocumentManagementPage} />
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </AnimatePresenceWrapper>
          </div>
        </main>
        <Toaster />
      </ErrorBoundary>
    </div>
  );
}

function NotFound() {
  return (
    <Card className="w-full max-w-md mx-4 mt-8">
      <CardContent className="pt-6">
        <div className="flex mb-4 gap-2">
          <FontAwesomeIcon icon="circle-exclamation" className="h-8 w-8 text-red-500" />
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
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}