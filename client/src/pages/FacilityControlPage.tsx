import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card"; // Added from original
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Equipment, FloorPlan } from "@db/schema"; //This line might need adjustment depending on usage
import FacilityDashboard from "@/components/facility/FacilityDashboard";

// Lazy load components (from original)
const EquipmentList = lazy(() => import("@/components/facility/EquipmentList"));
const FloorPlanView = lazy(() => import("@/components/facility/FloorPlanView"));
const EquipmentUsagePrediction = lazy(() => import("@/components/facility/EquipmentUsagePrediction"));
const EquipmentComparisonDashboard = lazy(() => import("@/components/facility/EquipmentComparisonDashboard"));
const EquipmentPerformanceReport = lazy(() => import("@/components/facility/EquipmentPerformanceReport"));
const MaintenanceScheduler = lazy(() => import("@/components/facility/MaintenanceScheduler"));
const MaintenanceTimeline = lazy(() => import("@/components/facility/MaintenanceTimeline"));
const TroubleshootingGuide = lazy(() => import("@/components/facility/TroubleshootingGuide"));

// Loading spinner component (from original)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function FacilityControlPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: equipment = [] } = useQuery<Equipment[]>({ // Added from original
    queryKey: ['/api/equipment'],
  });

  const { data: floorPlan } = useQuery<FloorPlan | null>({ // Added from original
    queryKey: ['/api/floor-plans/active'],
  });


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Facility Control</h1>
        <p className="text-muted-foreground">
          Monitor and manage facility equipment and maintenance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Suspense fallback={<LoadingSpinner />}>
            <FacilityDashboard equipment={equipment} floorPlan={floorPlan} /> {/*Added props, assuming they are needed*/}
          </Suspense>
        </TabsContent>

        <TabsContent value="equipment">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <EquipmentList equipment={equipment} /> {/*Added prop*/}
              <FloorPlanView floorPlan={floorPlan} equipment={equipment} /> {/*Added props*/}
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="maintenance">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceScheduler equipment={equipment} /> {/*Added prop*/}
              <MaintenanceTimeline equipment={equipment} /> {/*Added prop*/}
              <TroubleshootingGuide /> {/*This might need an equipment prop*/}
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <EquipmentUsagePrediction /> {/*This might need an equipment prop*/}
              <EquipmentComparisonDashboard /> {/*This might need an equipment prop*/}
              <EquipmentPerformanceReport /> {/*This might need an equipment prop*/}
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}