import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const DocManagement = lazy(() => import("./DocManagement"));
const TrainingModule = lazy(() => import("./TrainingModule"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export function DocManage() {
  const [location, setLocation] = useLocation();
  const showTraining = location === "/docmanage/training";

  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage your documents, configure training modules, and control document workflows.
        </p>
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            <Button
              variant={!showTraining ? "default" : "outline"}
              onClick={() => setLocation("/docmanage/docmanagement")}
            >
              Document Management
            </Button>
            <Button
              variant={showTraining ? "default" : "outline"}
              onClick={() => setLocation("/docmanage/training")}
            >
              Training Progress
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Suspense fallback={<LoadingSpinner />}>
          {showTraining ? <TrainingModule /> : <DocManagement />}
        </Suspense>
      </div>
    </div>
  );
}