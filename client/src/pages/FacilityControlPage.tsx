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

// Lazy load manufacturing-focused components
const EquipmentDashboard = lazy(() => import("@/components/facility/manufacturing/EquipmentDashboard"));
const PropertyAssetView = lazy(() => import("@/components/facility/manufacturing/PropertyAssetView"));
const MaintenanceScheduler = lazy(() => import("@/components/facility/manufacturing/MaintenanceScheduler"));
const ProductionLineStatus = lazy(() => import("@/components/facility/manufacturing/ProductionLineStatus"));
const QualityControlCenter = lazy(() => import("@/components/facility/manufacturing/QualityControlCenter"));
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
        <h1 className="text-3xl font-bold">Manufacturing Facility Control</h1>
        <p className="text-muted-foreground">
          Comprehensive manufacturing facility and equipment management platform
        </p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 lg:w-[800px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <EquipmentDashboard equipment={equipment} />
              <ProductionLineStatus />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="equipment">
          <Suspense fallback={<LoadingSpinner />}>
            <Card className="p-6">
              <EquipmentDashboard 
                equipment={equipment} 
                showDetails={true}
              />
            </Card>
          </Suspense>
        </TabsContent>

        <TabsContent value="production">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <ProductionLineStatus />
              <QualityControlCenter />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="maintenance">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <MaintenanceScheduler equipment={equipment} />
              <AssetLifecycleManager equipment={equipment} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="quality">
          <Suspense fallback={<LoadingSpinner />}>
            <QualityControlCenter showFullDashboard={true} />
          </Suspense>
        </TabsContent>

        <TabsContent value="assets">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <PropertyAssetView floorPlan={floorPlan} />
              <AssetLifecycleManager showFullDashboard={true} />
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}