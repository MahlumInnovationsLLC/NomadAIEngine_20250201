import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const DocManagement = lazy(() => import("./DocManagement").then(mod => ({ default: mod.DocManagement })));
const TrainingModule = lazy(() => import("./TrainingModule"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export function DocManage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage your documents, configure training modules, and control document workflows.
        </p>
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/docmanage/docmanagement")}>
              Document Management
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/docmanage/training")}
            >
              Training Module
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Suspense fallback={<LoadingSpinner />}>
          <DocManagement />
        </Suspense>
      </div>
    </div>
  );
}