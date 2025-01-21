import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";

// Lazy load route components
const Home = lazy(() => import("@/pages/Home"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ClubControlPage = lazy(() => import("@/pages/ClubControlPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DocManagePage = lazy(() => import("@/pages/DocManage"));
const DocumentManagementPage = lazy(() => import("@/pages/DocumentManagement"));
const TrainingModulePage = lazy(() => import("@/pages/TrainingModule"));
const SupportTickets = lazy(() => import("@/pages/admin/SupportTickets"));
const TicketDetailsPage = lazy(() => import("@/pages/TicketDetailsPage"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <NotificationCenter />
      </ErrorBoundary>

      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Navbar />
      </div>

      <main className="flex-1 pt-6">
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/chat/:id?" component={ChatPage} />
            <Route path="/docmanage" component={DocManagePage} />
            <Route path="/docmanage/docmanagement" component={DocumentManagementPage} />
            <Route path="/docmanage/training" component={TrainingModulePage} />
            <Route path="/club-control" component={ClubControlPage} />
            <Route path="/admin/support" component={SupportTickets} />
            <Route path="/admin/support/:id" component={TicketDetailsPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}

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