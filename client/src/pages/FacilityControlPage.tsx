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
const WorkOrderManager = lazy(() => import("@/components/facility/maintenance/WorkOrderManager"));
const MaintenanceRequestManager = lazy(() => import("@/components/facility/maintenance/MaintenanceRequestManager"));
const MaintenanceProcedureLibrary = lazy(() => import("@/components/facility/maintenance/MaintenanceProcedureLibrary"));
const PartsInventoryManager = lazy(() => import("@/components/facility/maintenance/PartsInventoryManager"));
const MaintenanceMetricsDashboard = lazy(() => import("@/components/facility/maintenance/MaintenanceMetricsDashboard"));

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
        <TabsList className="grid w-full grid-cols-8 lg:w-[1200px]">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="maintenance">PM Schedule</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="inventory">Parts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <EquipmentDashboard equipment={equipment} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="work-orders">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <WorkOrderManager equipment={equipment} showFullDashboard={true} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="requests">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceRequestManager />
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

        <TabsContent value="procedures">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceProcedureLibrary />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="inventory">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <PartsInventoryManager />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="metrics">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceMetricsDashboard />
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