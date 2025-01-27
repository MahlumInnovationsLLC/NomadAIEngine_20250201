import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import EquipmentDashboard from "./equipment/EquipmentDashboard";
import FacilityDashboard from "./facility/FacilityDashboard";
import { MaintenanceTimeline } from "./MaintenanceTimeline";
import StatisticsCards from "./StatisticsCards";
import EquipmentList from "./EquipmentList";
import { useQuery } from "@tanstack/react-query";
import { Equipment } from "@db/schema";
import { EquipmentHealthDashboard } from "./EquipmentHealthDashboard";

export default function ClubControlTabs() {
  const [activeTab, setActiveTab] = useState("equipment");
  const [activeEquipmentTab, setActiveEquipmentTab] = useState("management");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);

  // Fetch equipment data
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  const handleEquipmentSelect = (equipmentId: number) => {
    setSelectedEquipment(prev => {
      const isSelected = prev.some(eq => eq.id === equipmentId);
      if (isSelected) {
        return prev.filter(eq => eq.id !== equipmentId);
      }
      const equipment_item = equipment.find(eq => eq.id === equipmentId);
      if (equipment_item) {
        return [...prev, equipment_item];
      }
      return prev;
    });
  };

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="facility">Facility</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <StatisticsCards equipment={equipment} />

          {/* Equipment Sub-tabs */}
          <Tabs value={activeEquipmentTab} onValueChange={setActiveEquipmentTab}>
            <TabsList>
              <TabsTrigger value="management">Equipment Management</TabsTrigger>
              <TabsTrigger value="maintenance">Equipment Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="management" className="space-y-4">
              <EquipmentList 
                equipment={equipment}
                onEquipmentSelect={handleEquipmentSelect}
                selectedEquipment={selectedEquipment}
              />
              <EquipmentDashboard />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <EquipmentHealthDashboard />
              <MaintenanceTimeline equipment={equipment} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="facility" className="space-y-4">
          <FacilityDashboard />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
