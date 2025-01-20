import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { Equipment } from "@db/schema";

interface StatisticsCardsProps {
  equipment: Equipment[];
}

export default function StatisticsCards({ equipment }: StatisticsCardsProps) {
  const activeEquipment = equipment.filter(eq => eq.status === 'active');
  const maintenanceEquipment = equipment.filter(eq => eq.status === 'maintenance');
  const offlineEquipment = equipment.filter(eq => eq.status === 'offline');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Equipment
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {equipment.length}
              </h3>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Devices
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {activeEquipment.length}
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Maintenance Required
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {maintenanceEquipment.length}
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Offline Devices
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {offlineEquipment.length}
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
