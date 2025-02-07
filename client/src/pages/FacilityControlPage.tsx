
import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Equipment, FloorPlan } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <Skeleton className="h-12 w-12 rounded-full" />
  </div>
);

// Lazy load components
const EquipmentList = lazy(() => import("@/components/facility/EquipmentList"));
const FloorPlanView = lazy(() => import("@/components/facility/FloorPlanView"));
const EquipmentUsagePrediction = lazy(() => import("@/components/facility/EquipmentUsagePrediction"));
const EquipmentComparisonDashboard = lazy(() => import("@/components/facility/EquipmentComparisonDashboard"));
const EquipmentPerformanceReport = lazy(() => import("@/components/facility/EquipmentPerformanceReport"));
const MaintenanceScheduler = lazy(() => import("@/components/facility/MaintenanceScheduler"));
const MaintenanceTimeline = lazy(() => import("@/components/facility/MaintenanceTimeline"));
const TroubleshootingGuide = lazy(() => import("@/components/facility/TroubleshootingGuide"));

export default function FacilityControlPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const { data: equipment = [], isLoading: isLoadingEquipment } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  const { data: floorPlan, isLoading: isLoadingFloorPlan } = useQuery<FloorPlan>({
    queryKey: ['/api/floor-plans/active'],
  });

  if (isLoadingEquipment || isLoadingFloorPlan) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Facility Control</h1>
        <p className="text-muted-foreground">
          Monitor and manage facility equipment and maintenance
        </p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab.toString()} onValueChange={(value: string) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Suspense fallback={<LoadingSpinner />}>
            <Card className="p-6">
              <EquipmentList equipment={equipment} />
              <FloorPlanView floorPlan={floorPlan} equipment={equipment} />
            </Card>
          </Suspense>
        </TabsContent>

        <TabsContent value="equipment">
          <Suspense fallback={<LoadingSpinner />}>
            <Card className="p-6">
              <EquipmentList equipment={equipment} />
              <FloorPlanView floorPlan={floorPlan} equipment={equipment} />
            </Card>
          </Suspense>
        </TabsContent>

        <TabsContent value="maintenance">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceScheduler equipment={equipment} />
              <MaintenanceTimeline equipment={equipment} />
              <TroubleshootingGuide equipment={equipment} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <EquipmentUsagePrediction equipment={equipment} />
              <EquipmentComparisonDashboard equipment={equipment} />
              <EquipmentPerformanceReport equipment={equipment} />
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
