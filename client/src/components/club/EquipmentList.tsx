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
import { Settings, AlertCircle, Edit, Plus, LayoutDashboard, List } from "lucide-react";
import { TroubleshootingGuide } from "./TroubleshootingGuide";
import { useState } from "react";
import { MaintenanceScheduler } from "./MaintenanceScheduler";
import { EquipmentEditDialog } from "./EquipmentEditDialog";
import { EquipmentQuickAdd } from "./EquipmentQuickAdd";
import { EquipmentHealthDashboard } from "./EquipmentHealthDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface EquipmentListProps {
  equipment: Equipment[];
  onEquipmentSelect?: (equipmentId: number) => void;
  selectedEquipment?: Equipment[];
}

const statusColors: Record<string, string> = {
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

const getConnectionStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'text-green-500';
    case 'disconnected':
      return 'text-red-500';
    case 'pairing':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
};

export default function EquipmentList({ equipment, onEquipmentSelect, selectedEquipment = [] }: EquipmentListProps) {
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null);
  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTroubleshoot, setSelectedTroubleshoot] = useState<Equipment | null>(null);

  const isSelected = (item: Equipment) => {
    return selectedEquipment.some(eq => eq.id === item.id);
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate", item: Equipment) => {
    if (onEquipmentSelect && checked !== "indeterminate") {
      onEquipmentSelect(item.id);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipment Management</h2>
          <p className="text-sm text-muted-foreground">
            Select up to 5 items for comparison using the checkboxes
          </p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> Quick Add Equipment
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Health Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead>Device Connection</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => (
                <TableRow 
                  key={item.id}
                  className={cn(
                    "hover:bg-accent/50",
                    isSelected(item) && "bg-accent"
                  )}
                >
                  <TableCell>
                    <Checkbox 
                      checked={isSelected(item)}
                      onCheckedChange={(checked) => handleCheckboxChange(checked, item)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
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
                    <span className={getConnectionStatusColor(item.deviceConnectionStatus || '')}>
                      {item.deviceConnectionStatus ? (
                        <Badge variant="outline" className="capitalize">
                          {item.deviceConnectionStatus}
                        </Badge>
                      ) : (
                        "Not Connected"
                      )}
                    </span>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditEquipment(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTroubleshoot(item)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="health">
          <EquipmentHealthDashboard />
        </TabsContent>
      </Tabs>

      {selectedTroubleshoot && (
        <TroubleshootingGuide
          equipment={selectedTroubleshoot}
          open={!!selectedTroubleshoot}
          onOpenChange={(open) => !open && setSelectedTroubleshoot(null)}
        />
      )}

      {maintenanceEquipment && (
        <MaintenanceScheduler
          equipment={maintenanceEquipment}
          open={!!maintenanceEquipment}
          onOpenChange={(open) => !open && setMaintenanceEquipment(null)}
        />
      )}

      {editEquipment && (
        <EquipmentEditDialog
          equipment={editEquipment}
          open={!!editEquipment}
          onOpenChange={(open) => !open && setEditEquipment(null)}
        />
      )}

      <EquipmentQuickAdd
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
      />
    </div>
  );
}