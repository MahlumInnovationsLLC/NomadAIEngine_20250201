import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AnimatePresenceWrapper, AnimateTransition } from "@/components/ui/AnimateTransition";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import Navbar from "@/components/layout/Navbar";
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/msal-config";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Lazy load route components with error boundaries
const Home = lazy(() => import("./pages/Home"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ManufacturingControlPage = lazy(() => import("./pages/ManufacturingControlPage"));
const ManufacturingPage = lazy(() => import("./pages/manufacturing"));
const ManufacturingQualityTemplatesPage = lazy(() => import("./pages/ManufacturingQualityTemplatesPage"));
const ManufacturingQualityInspectionPage = lazy(() => import("./pages/ManufacturingQualityInspectionPage"));
const MarketingControl = lazy(() => import("./pages/MarketingControl"));
const MaterialHandling = lazy(() => import("./components/material/MaterialDashboard"));
const SalesControl = lazy(() => import("./pages/SalesControl"));
const FacilityControlPage = lazy(() => import("./pages/FacilityControlPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DocumentManagementPage = lazy(() => import("./pages/DocumentManagement"));
const TrainingModulePage = lazy(() => import("./pages/TrainingModule"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const TicketDetails = lazy(() => import("./pages/admin/TicketDetails"));
const SupportTickets = lazy(() => import("./pages/admin/SupportTickets"));
const TicketDetailsPage = lazy(() => import("./pages/TicketDetailsPage"));
const FieldServiceDashboard = lazy(() => import("./components/field-service/FieldServiceDashboard"));
const ConnectionTest = lazy(() => import("./components/debug/ConnectionTest"));


function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function RedirectToLogin() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/login");
  }, [setLocation]);
  return <LoadingFallback />;
}

function RedirectToDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  return <LoadingFallback />;
}

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const isAuthenticated = useIsAuthenticated();

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<LoadingFallback />}>
        <AuthenticatedTemplate>
          <OnboardingProvider>
            <AnimateTransition variant="fade">
              <Component {...rest} />
            </AnimateTransition>
            <OnboardingTour />
          </OnboardingProvider>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <RedirectToLogin />
        </UnauthenticatedTemplate>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  // We don't need to handle login logic here anymore
  // It's handled in AppWrapper and LoginPage
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col overflow-auto">
      <div className="fixed inset-0 -z-20 w-full h-full">
        <ParticleBackground className="absolute inset-0 w-full h-full" particleColor="rgba(239, 68, 68, 0.2)" />
        <div className="absolute inset-0 w-full h-full bg-background/90" />
      </div>

      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <AuthenticatedTemplate>
          <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Navbar />
          </div>
        </AuthenticatedTemplate>

        <main className="flex-1 pt-6 relative z-10">
          <div className="container mx-auto">
            <AnimatePresenceWrapper>
              <Suspense fallback={<LoadingFallback />}>
                <Switch>
                  <Route path="/login">
                    <UnauthenticatedTemplate>
                      <LoginPage />
                    </UnauthenticatedTemplate>
                    <AuthenticatedTemplate>
                      <RedirectToDashboard />
                    </AuthenticatedTemplate>
                  </Route>
                  <Route path="/" component={() => <ProtectedRoute component={Home} />} />
                  <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
                  <Route path="/chat/:id?" component={() => <ProtectedRoute component={ChatPage} />} />
                  <Route path="/manufacturing-control" component={() => <ProtectedRoute component={ManufacturingControlPage} />} />
                  <Route path="/manufacturing" component={() => <ProtectedRoute component={ManufacturingControlPage} />} />
                  <Route path="/manufacturing/quality-templates" component={() => <ProtectedRoute component={ManufacturingQualityTemplatesPage} />} />
                  <Route path="/sales-control" component={() => <ProtectedRoute component={SalesControl} />} />
                  <Route path="/marketing-control" component={() => <ProtectedRoute component={MarketingControl} />} />
                  <Route path="/material-handling" component={() => <ProtectedRoute component={MaterialHandling} />} />
                  <Route path="/facility-control" component={() => <ProtectedRoute component={FacilityControlPage} />} />
                  <Route path="/field-service" component={() => <ProtectedRoute component={FieldServiceDashboard} />} />
                  <Route path="/docmanage" component={() => <ProtectedRoute component={DocumentManagementPage} />} />
                  <Route path="/manufacturing/quality-inspection/:templateId" component={() => <ProtectedRoute component={ManufacturingQualityInspectionPage} />} />
                  <Route path="/debug/connection-test" component={ConnectionTest} />
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
    <AnimateTransition variant="slide-up">
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
    </AnimateTransition>
  );
}

export default function AppWrapper() {
  // Initialize the application once 
  useEffect(() => {
    // Initialize the MSAL instance first
    msalInstance.initialize().then(() => {
      // Then handle any redirect
      msalInstance.handleRedirectPromise()
        .then(response => {
          if (response) {
            console.log("Redirect success, response:", response);
            // Set account as active if it exists
            const account = response.account;
            if (account) {
              msalInstance.setActiveAccount(account);
            }
          }
        })
        .catch(error => {
          console.error("Redirect error:", error);
        });
    });
  }, []);

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <App />
          </ThemeProvider>
        </QueryClientProvider>
      </MsalProvider>
    </ErrorBoundary>
  );
}