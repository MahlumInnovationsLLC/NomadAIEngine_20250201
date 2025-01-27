import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { Equipment, FloorPlan } from "@db/schema";
import FacilityDashboard from "@/components/club/facility/FacilityDashboard";

// Lazy load components
const EquipmentList = lazy(() => import("@/components/club/EquipmentList"));
const FloorPlanView = lazy(() => import("@/components/club/FloorPlanView"));
const EquipmentUsagePrediction = lazy(() => import("@/components/club/EquipmentUsagePrediction"));
const EquipmentComparisonDashboard = lazy(() => import("@/components/club/EquipmentComparisonDashboard"));
const EquipmentPerformanceReport = lazy(() => import("@/components/club/EquipmentPerformanceReport"));
const StatisticsCards = lazy(() => import("@/components/club/StatisticsCards"));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function ClubControlPage() {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [showingPrediction, setShowingPrediction] = useState(false);

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  const { data: floorPlan } = useQuery<FloorPlan | null>({
    queryKey: ['/api/floor-plans/active'],
  });

  const handleEquipmentSelect = (equipmentId: number) => {
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
        <h1 className="text-3xl font-bold">Club Control</h1>
        <p className="text-muted-foreground">
          Manage your facility equipment and maintenance
        </p>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="facility">Facility</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="space-y-6">
              <EquipmentList 
                equipment={equipment} 
                onEquipmentSelect={handleEquipmentSelect}
                selectedEquipment={selectedEquipment}
              />
              {showingPrediction && selectedEquipment.length > 0 && (
                <EquipmentUsagePrediction equipmentId={selectedEquipment[0].id} />
              )}
              <EquipmentComparisonDashboard selectedEquipment={selectedEquipment} />
              <EquipmentPerformanceReport selectedEquipment={selectedEquipment} />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="facility">
          <Suspense fallback={<LoadingSpinner />}>
            <FacilityDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}