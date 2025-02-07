import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import EquipmentDashboard from "./equipment/EquipmentDashboard";
import FacilityDashboard from "./facility/FacilityDashboard";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

interface FacilityStats {
  equipmentHealth: number;
  pendingMaintenance: number;
  facilityUtilization: number;
  activeAlerts: number;
}

export default function FacilityControlTabs() {
  const [activeTab, setActiveTab] = useState<string>("equipment");

  const { data: stats } = useQuery<FacilityStats>({
    queryKey: ['/api/facility/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Facility Control</h1>
          <p className="text-muted-foreground mb-4">
            Monitor and manage facility equipment, maintenance, and operations
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Equipment Health</p>
                    <h3 className="text-2xl font-bold">{stats?.equipmentHealth || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="gauge-high" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Maintenance</p>
                    <h3 className="text-2xl font-bold">{stats?.pendingMaintenance || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="wrench" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Facility Utilization</p>
                    <h3 className="text-2xl font-bold">{stats?.facilityUtilization || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="building" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                    <h3 className="text-2xl font-bold">{stats?.activeAlerts || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="bell" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6">
          <Tabs defaultValue="equipment" value={activeTab} onValueChange={(value: string) => setActiveTab(value)} className="p-6">
            <TabsList className="grid grid-cols-2 w-[400px] mb-6">
              <TabsTrigger value="equipment">
                <FontAwesomeIcon icon="cogs" className="mr-2" />
                Equipment
              </TabsTrigger>
              <TabsTrigger value="facility">
                <FontAwesomeIcon icon="building" className="mr-2" />
                Facility
              </TabsTrigger>
            </TabsList>

            <TabsContent value="equipment" className="space-y-4">
              <EquipmentDashboard />
            </TabsContent>

            <TabsContent value="facility" className="space-y-4">
              <FacilityDashboard />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AnimateTransition>
  );
}