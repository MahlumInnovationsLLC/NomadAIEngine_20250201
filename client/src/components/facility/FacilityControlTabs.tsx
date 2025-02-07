
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import EquipmentDashboard from "./equipment/EquipmentDashboard";
import FacilityDashboard from "./facility/FacilityDashboard";

export default function FacilityControlTabs() {
  const [activeTab, setActiveTab] = useState<string>("equipment");

  return (
    <Card className="p-6">
      <Tabs defaultValue="equipment" value={activeTab} onValueChange={(value: string) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="facility">Facility</TabsTrigger>
        </TabsList>
        
        <TabsContent value="equipment" className="space-y-4">
          <EquipmentDashboard />
        </TabsContent>
        
        <TabsContent value="facility" className="space-y-4">
          <FacilityDashboard />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
