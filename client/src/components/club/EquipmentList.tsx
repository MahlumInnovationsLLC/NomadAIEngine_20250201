import { Equipment } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Activity, AlertCircle } from "lucide-react";
import { TroubleshootingGuide } from "./TroubleshootingGuide";
import { useState } from "react";
import { MaintenanceScheduler } from "./MaintenanceScheduler";

interface EquipmentListProps {
  equipment: Equipment[];
}

const statusColors = {
  active: "bg-green-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
  error: "bg-red-500",
};

const getHealthColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

export default function EquipmentList({ equipment }: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null);

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Equipment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Health Score</TableHead>
            <TableHead>Last Maintenance</TableHead>
            <TableHead>Next Maintenance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusColors[item.status]}`} />
                  <span className="capitalize">{item.status}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getHealthColor(Number(item.healthScore))}`} />
                  <span>{item.healthScore}%</span>
                </div>
              </TableCell>
              <TableCell>
                {item.lastMaintenance
                  ? new Date(item.lastMaintenance).toLocaleDateString()
                  : "Never"}
              </TableCell>
              <TableCell>
                {item.nextMaintenance
                  ? new Date(item.nextMaintenance).toLocaleDateString()
                  : "Not scheduled"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setMaintenanceEquipment(item)}
                  >
                    <Settings className="h-4 w-4" />
                    Schedule
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedEquipment(item)}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedEquipment && (
        <TroubleshootingGuide
          equipment={selectedEquipment}
          open={!!selectedEquipment}
          onOpenChange={(open) => !open && setSelectedEquipment(null)}
        />
      )}

      {maintenanceEquipment && (
        <MaintenanceScheduler
          equipment={maintenanceEquipment}
          open={!!maintenanceEquipment}
          onOpenChange={(open) => !open && setMaintenanceEquipment(null)}
        />
      )}
    </div>
  );
}