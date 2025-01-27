import { useState, lazy, Suspense } from "react";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import FacilityDashboard from "@/components/club/facility/FacilityDashboard";

export default function ClubControlPage() {
  const [activeTab, setActiveTab] = useState("facility");

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Club Control</h1>
          <p className="text-muted-foreground">
            Manage your facility equipment and maintenance
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <FacilityDashboard />
        </Suspense>
      </div>
    </AnimateTransition>
  );
}