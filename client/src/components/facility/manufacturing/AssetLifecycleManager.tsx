import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Equipment } from "@db/schema";

interface AssetLifecycleManagerProps {
  equipment?: Equipment[];
  showFullDashboard?: boolean;
  maintenanceOnly?: boolean;
}

export default function AssetLifecycleManager({ 
  equipment = [], 
  showFullDashboard = false,
  maintenanceOnly = false 
}: AssetLifecycleManagerProps) {
  const [activeView, setActiveView] = useState<'overview' | 'history'>('overview');

  const { data: maintenanceHistory } = useQuery({
    queryKey: ['/api/maintenance/history'],
    enabled: showFullDashboard,
  });

  const getAssetHealth = (eq: Equipment) => {
    // Calculate asset health based on maintenance history
    const lastMaintenance = eq.lastMaintenance 
      ? Math.floor((new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    if (lastMaintenance > 180) return 'critical';
    if (lastMaintenance > 90) return 'warning';
    return 'good';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Equipment Health & Maintenance History</span>
          <div className="flex gap-2">
            <Button 
              variant={activeView === 'overview' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('overview')}
            >
              Overview
            </Button>
            <Button 
              variant={activeView === 'history' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('history')}
            >
              Maintenance History
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Equipment</div>
                  <div className="text-2xl font-bold">{equipment.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Needs Maintenance</div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {equipment.filter(eq => getAssetHealth(eq) === 'warning').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Critical Status</div>
                  <div className="text-2xl font-bold text-red-500">
                    {equipment.filter(eq => getAssetHealth(eq) === 'critical').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Health Status</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead>Service History</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq) => {
                  const health = getAssetHealth(eq);

                  return (
                    <TableRow key={eq.id}>
                      <TableCell className="font-medium">{eq.name}</TableCell>
                      <TableCell>{eq.equipmentTypeId}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            health === 'good'
                              ? 'bg-green-500/10 text-green-500'
                              : health === 'warning'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }
                        >
                          {health}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {eq.lastMaintenance 
                          ? new Date(eq.lastMaintenance).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {eq.maintenanceCount || 0} services
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon={['fal', 'history']} className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Maintenance History</h3>
            <div className="space-y-4">
              {maintenanceHistory?.map((record: any) => (
                <Card key={record.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{record.equipmentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()} - {record.type}
                      </p>
                      <p className="mt-2">{record.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="bg-blue-500/10 text-blue-500"
                    >
                      {record.technician}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}