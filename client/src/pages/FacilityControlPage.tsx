import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Equipment, FloorPlan } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <Skeleton className="h-12 w-12 rounded-full" />
  </div>
);

// Lazy load maintenance-focused components
const EquipmentDashboard = lazy(() => import("@/components/facility/manufacturing/EquipmentDashboard"));
const MaintenanceScheduler = lazy(() => import("@/components/facility/manufacturing/MaintenanceScheduler"));
const AssetLifecycleManager = lazy(() => import("@/components/facility/manufacturing/AssetLifecycleManager"));

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
        <h1 className="text-3xl font-bold">Facility Maintenance Control</h1>
        <p className="text-muted-foreground">
          Comprehensive equipment maintenance and preventative maintenance management
        </p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="assets">Asset Health</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <EquipmentDashboard equipment={equipment} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="maintenance">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceScheduler equipment={equipment} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="assets">
          <Suspense fallback={<LoadingSpinner />}>
            <Card className="p-6">
              <AssetLifecycleManager 
                equipment={equipment} 
                showFullDashboard={true}
                maintenanceOnly={true}
              />
            </Card>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}