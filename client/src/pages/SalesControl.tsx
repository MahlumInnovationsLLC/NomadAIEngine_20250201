import { Suspense } from "react";
import { SalesControlDashboard } from "@/components/sales/SalesControlDashboard";
import { Card } from "@/components/ui/card";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function SalesControl() {
  return (
    <div className="container mx-auto">
      <div className="py-6 border-b">
        <div className="container px-4">
          <h1 className="text-3xl font-bold mb-2">Sales Control</h1>
          <p className="text-muted-foreground">
            Manage sales pipelines, analytics, and customer relationships.
          </p>
        </div>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <SalesControlDashboard />
      </Suspense>
    </div>
  );
}