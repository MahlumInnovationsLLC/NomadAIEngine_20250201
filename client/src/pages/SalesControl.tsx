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
    <Suspense fallback={<LoadingFallback />}>
      <SalesControlDashboard />
    </Suspense>
  );
}