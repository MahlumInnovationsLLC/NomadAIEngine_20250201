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
          <span>Maintenance Schedule</span>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Last Maintenance</TableHead>
              <TableHead>Next Due</TableHead>
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
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <FontAwesomeIcon icon={['fal', 'wrench']} className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
