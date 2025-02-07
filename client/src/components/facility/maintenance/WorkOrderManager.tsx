import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Equipment } from "@db/schema";

interface WorkOrderManagerProps {
  equipment?: Equipment[];
  showFullDashboard?: boolean;
}

export default function WorkOrderManager({ equipment = [], showFullDashboard = false }: WorkOrderManagerProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-progress' | 'completed'>('all');

  const { data: workOrders = [] } = useQuery({
    queryKey: ['/api/maintenance/work-orders'],
    enabled: true,
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500/10 text-red-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      low: "bg-green-500/10 text-green-500"
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Work Order Management</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'plus']} className="h-4 w-4" />
              New Work Order
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'filter']} className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Open Orders</div>
                <div className="text-2xl font-bold">{workOrders.filter((wo: any) => wo.status === 'open').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">In Progress</div>
                <div className="text-2xl font-bold">{workOrders.filter((wo: any) => wo.status === 'in-progress').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Completed Today</div>
                <div className="text-2xl font-bold">{workOrders.filter((wo: any) => wo.status === 'completed' && new Date(wo.completedAt).toDateString() === new Date().toDateString()).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Past Due</div>
                <div className="text-2xl font-bold text-red-500">{workOrders.filter((wo: any) => wo.status !== 'completed' && new Date(wo.dueDate) < new Date()).length}</div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((wo: any) => (
                <TableRow key={wo.id}>
                  <TableCell className="font-medium">WO-{wo.id}</TableCell>
                  <TableCell>{wo.equipmentName}</TableCell>
                  <TableCell>{wo.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(wo.priority)}>
                      {wo.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        wo.status === 'completed' 
                          ? 'bg-green-500/10 text-green-500'
                          : wo.status === 'in-progress'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }
                    >
                      {wo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(wo.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{wo.assignedTo}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'edit']} className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'clipboard-list']} className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
