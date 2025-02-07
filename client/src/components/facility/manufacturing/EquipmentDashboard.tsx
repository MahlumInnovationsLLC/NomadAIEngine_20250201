import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Equipment } from "@db/schema";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface EquipmentDashboardProps {
  equipment: Equipment[];
  showDetails?: boolean;
}

export default function EquipmentDashboard({ equipment, showDetails = false }: EquipmentDashboardProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);

  const { data: maintenanceStats } = useQuery({
    queryKey: ['/api/equipment/maintenance-stats'],
    enabled: showDetails,
  });

  const getMaintenanceStatus = (eq: Equipment) => {
    if (!eq.lastMaintenance) return "overdue";
    const daysSinceLastMaintenance = Math.floor(
      (new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastMaintenance > 90) return "overdue";
    if (daysSinceLastMaintenance > 60) return "due-soon";
    return "up-to-date";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "up-to-date": "bg-green-500",
      "due-soon": "bg-yellow-500",
      "overdue": "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getNextMaintenanceDate = (eq: Equipment) => {
    if (!eq.lastMaintenance) return "Immediate";
    const lastMaintenance = new Date(eq.lastMaintenance);
    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setDate(nextMaintenance.getDate() + 90); // 90 days maintenance interval
    return formatDistanceToNow(nextMaintenance, { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Equipment Maintenance Overview</span>
            <Button variant="outline" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'plus']} />
              Add Equipment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => {
                const maintenanceStatus = getMaintenanceStatus(eq);
                return (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell>{eq.equipmentTypeId}</TableCell>
                    <TableCell>
                      {eq.lastMaintenance ? (
                        formatDistanceToNow(new Date(eq.lastMaintenance), { addSuffix: true })
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>{getNextMaintenanceDate(eq)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(maintenanceStatus)} text-white`}>
                        {maintenanceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEquipmentId(eq.id)}>
                          <FontAwesomeIcon icon={['fal', 'wrench']} className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon={['fal', 'history']} className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {maintenanceStats?.dueSoon || 0}
              </div>
              <p className="text-muted-foreground">Equipment requiring maintenance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overdue Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {maintenanceStats?.overdue || 0}
              </div>
              <p className="text-muted-foreground">Critical maintenance needed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {maintenanceStats?.complianceRate || 0}%
              </div>
              <p className="text-muted-foreground">Overall maintenance adherence</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}