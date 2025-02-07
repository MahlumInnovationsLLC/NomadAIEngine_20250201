import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Equipment, FloorPlan } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <Skeleton className="h-12 w-12 rounded-full" />
  </div>
);

// Lazy load components
const EquipmentDashboard = lazy(() => import("@/components/facility/manufacturing/EquipmentDashboard"));
const MaintenanceScheduler = lazy(() => import("@/components/facility/manufacturing/MaintenanceScheduler"));
const AssetLifecycleManager = lazy(() => import("@/components/facility/manufacturing/AssetLifecycleManager"));
const WorkOrderManager = lazy(() => import("@/components/facility/maintenance/WorkOrderManager"));
const MaintenanceRequestManager = lazy(() => import("@/components/facility/maintenance/MaintenanceRequestManager"));
const MaintenanceProcedureLibrary = lazy(() => import("@/components/facility/maintenance/MaintenanceProcedureLibrary"));
const PartsInventoryManager = lazy(() => import("@/components/facility/maintenance/PartsInventoryManager"));
const MaintenanceMetricsDashboard = lazy(() => import("@/components/facility/maintenance/MaintenanceMetricsDashboard"));
const AssetViewer3D = lazy(() => import("@/components/facility/asset-visualization/AssetViewer3D"));
const Building3DEditor = lazy(() => import("@/components/facility/asset-visualization/Building3DEditor"));
const ModelUploader = lazy(() => import("@/components/facility/asset-visualization/ModelUploader"));

export default function FacilityControlPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showModelUploader, setShowModelUploader] = useState(false);

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
        <TabsList className="grid w-full grid-cols-9 lg:w-[1200px]">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="maintenance">PM Schedule</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="inventory">Parts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="3d-view">3D View</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="building-editor">Building Editor</TabsTrigger>
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

        <TabsContent value="3d-view">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AssetViewer3D equipment={selectedEquipment || undefined} />
                </div>
                <div>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Equipment List</h3>
                    <div className="space-y-2">
                      {equipment.map((eq) => (
                        <Button
                          key={eq.id}
                          variant={selectedEquipment?.id === eq.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedEquipment(eq)}
                        >
                          {eq.name}
                        </Button>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
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

        <TabsContent value="building-editor">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Building3DEditor />
                </div>
                <div className="space-y-6">
                  <Button
                    className="w-full"
                    onClick={() => setShowModelUploader(!showModelUploader)}
                  >
                    <FontAwesomeIcon
                      icon={['fal', 'upload']}
                      className="h-4 w-4 mr-2"
                    />
                    Upload Equipment Model
                  </Button>
                  {showModelUploader && (
                    <ModelUploader
                      onSuccess={(url) => {
                        // Handle successful upload
                        setShowModelUploader(false);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}