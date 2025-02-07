import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Equipment } from "@db/schema";
import { formatDistanceToNow } from "date-fns";

interface MaintenanceSchedulerProps {
  equipment: Equipment[];
}

export default function MaintenanceScheduler({ equipment }: MaintenanceSchedulerProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue'>('all');

  const { data: maintenanceSchedule } = useQuery({
    queryKey: ['/api/maintenance/schedule'],
    enabled: true,
  });

  const filteredEquipment = equipment.filter(eq => {
    if (filterStatus === 'all') return true;
    const daysSinceLastMaintenance = eq.lastMaintenance
      ? Math.floor((new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;
    return filterStatus === 'overdue' ? daysSinceLastMaintenance > 90 : daysSinceLastMaintenance <= 90;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Preventative Maintenance Schedule</span>
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button 
              variant={filterStatus === 'pending' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={filterStatus === 'overdue' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('overdue')}
            >
              Overdue
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Scheduled This Week</div>
                <div className="text-2xl font-bold">{maintenanceSchedule?.thisWeek || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Upcoming (30 Days)</div>
                <div className="text-2xl font-bold">{maintenanceSchedule?.upcoming || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Overdue Tasks</div>
                <div className="text-2xl font-bold text-red-500">{maintenanceSchedule?.overdue || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Maintenance Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((eq) => {
                const daysSinceLastMaintenance = eq.lastMaintenance
                  ? Math.floor((new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
                  : Infinity;
                const status = daysSinceLastMaintenance > 90 ? 'overdue' : 'pending';
                const maintenanceType = eq.maintenanceType || 'Regular Service';

                return (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell>
                      {eq.lastMaintenance 
                        ? formatDistanceToNow(new Date(eq.lastMaintenance), { addSuffix: true })
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {eq.lastMaintenance 
                        ? formatDistanceToNow(new Date(new Date(eq.lastMaintenance).getTime() + 90 * 24 * 60 * 60 * 1000))
                        : 'Immediate'
                      }
                    </TableCell>
                    <TableCell>{maintenanceType}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          status === 'overdue' 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-yellow-500/10 text-yellow-500'
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon={['fal', 'calendar']} className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon={['fal', 'wrench']} className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}