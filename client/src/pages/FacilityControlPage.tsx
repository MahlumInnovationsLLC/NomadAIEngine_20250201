import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Equipment, FloorPlan } from "@db/schema";
import FacilityDashboard from "@/components/facility/FacilityDashboard";

// Lazy load components
const EquipmentList = lazy(() => import("@/components/club/EquipmentList"));
const FloorPlanView = lazy(() => import("@/components/club/FloorPlanView"));
const EquipmentUsagePrediction = lazy(() => import("@/components/facility/EquipmentUsagePrediction"));
const EquipmentComparisonDashboard = lazy(() => import("@/components/facility/EquipmentComparisonDashboard"));
const EquipmentPerformanceReport = lazy(() => import("@/components/facility/EquipmentPerformanceReport"));
const MaintenanceScheduler = lazy(() => import("@/components/facility/MaintenanceScheduler"));
const MaintenanceTimeline = lazy(() => import("@/components/facility/MaintenanceTimeline"));
const TroubleshootingGuide = lazy(() => import("@/components/facility/TroubleshootingGuide"));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function FacilityControlPage() {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [showingPrediction, setShowingPrediction] = useState(false);
  const [activeTab, setActiveTab] = useState("equipment");

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  const { data: floorPlan } = useQuery<FloorPlan | null>({
    queryKey: ['/api/floor-plans/active'],
  });

  const handleEquipmentSelect = (equipmentId: string) => {
    const equipment_item = equipment.find(eq => eq.id === equipmentId);
    if (!equipment_item) return;

    setSelectedEquipment(prev => {
      const isAlreadySelected = prev.some(eq => eq.id === equipmentId);
      if (isAlreadySelected) {
        return prev.filter(eq => eq.id !== equipmentId);
      } else {
        return [...prev, equipment_item].slice(-5);
      }
    });
    setShowingPrediction(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Facility Control</h1>
        <p className="text-muted-foreground">
          Monitor and manage facility equipment, maintenance, and IoT devices
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="equipment">
            <FontAwesomeIcon icon="industry" className="mr-2 h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <FontAwesomeIcon icon="wrench" className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <FontAwesomeIcon icon="chart-line" className="mr-2 h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-card rounded-lg border">
                  <FloorPlanView 
                    floorPlan={floorPlan} 
                    equipment={equipment}
                  />
                </Card>
              </div>

              <div className="space-y-8">
                <EquipmentList 
                  equipment={equipment} 
                  onEquipmentSelect={handleEquipmentSelect}
                  selectedEquipment={selectedEquipment}
                />

                {showingPrediction && selectedEquipment.length === 1 && (
                  <EquipmentUsagePrediction equipmentId={selectedEquipment[0].id} />
                )}

                <EquipmentPerformanceReport selectedEquipment={selectedEquipment} />
              </div>
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MaintenanceScheduler equipment={equipment} />
              <MaintenanceTimeline equipment={equipment} />
            </div>
            {selectedEquipment.length > 0 && (
              <TroubleshootingGuide equipment={selectedEquipment[0]} />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EquipmentComparisonDashboard selectedEquipment={selectedEquipment} />
              {selectedEquipment.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Real-time Monitoring</h3>
                    {/* Real-time monitoring charts will be implemented here */}
                  </CardContent>
                </Card>
              )}
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}