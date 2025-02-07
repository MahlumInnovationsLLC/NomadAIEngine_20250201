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

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-500",
      maintenance: "bg-yellow-500",
      offline: "bg-red-500",
      error: "bg-red-700"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getMaintenanceUrgency = (equipment: Equipment) => {
    if (!equipment.lastMaintenance) return "high";
    const daysSinceLastMaintenance = Math.floor(
      (new Date().getTime() - new Date(equipment.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastMaintenance > 90) return "high";
    if (daysSinceLastMaintenance > 60) return "medium";
    return "low";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manufacturing Equipment Overview</span>
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
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(eq.status)} text-white`}>
                      {eq.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{eq.equipmentType?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {eq.lastMaintenance ? (
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className={`bg-${getMaintenanceUrgency(eq)}`}>
                          {formatDistanceToNow(new Date(eq.lastMaintenance))} ago
                        </Badge>
                      </span>
                    ) : (
                      <Badge variant="outline" className="bg-red-500">Never</Badge>
                    )}
                  </TableCell>
                  <TableCell>{eq.uptime ? `${eq.uptime}%` : 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEquipmentId(eq.id)}>
                        <FontAwesomeIcon icon={['fal', 'wrench']} className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'chart-line']} className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              <CardTitle>Average Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {maintenanceStats?.averageUptime || 0}%
              </div>
              <p className="text-muted-foreground">Across all equipment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {maintenanceStats?.criticalIssues || 0}
              </div>
              <p className="text-muted-foreground">Requiring immediate attention</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
