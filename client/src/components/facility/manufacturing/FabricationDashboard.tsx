import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface MachineStatus {
  id: string;
  name: string;
  type: 'welding' | 'laser' | 'bending' | 'cnc';
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentJob?: string;
  progress?: number;
  queueLength: number;
  efficiency: number;
}

interface FabricationMetrics {
  activeJobs: number;
  completedToday: number;
  efficiency: number;
  materialUtilization: number;
  machineUtilization: Record<string, number>;
}

export default function FabricationDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: machines = [] } = useQuery<MachineStatus[]>({
    queryKey: ['/api/fabrication/machines'],
  });

  const { data: metrics } = useQuery<FabricationMetrics>({
    queryKey: ['/api/fabrication/metrics'],
  });

  const getStatusColor = (status: string) => {
    const colors = {
      idle: "bg-gray-500",
      running: "bg-green-500",
      maintenance: "bg-yellow-500",
      error: "bg-red-500"
    };
    return colors[status as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <FontAwesomeIcon icon="industry" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <FontAwesomeIcon icon="check-circle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completedToday || 0}</div>
            <p className="text-xs text-muted-foreground">Jobs completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Rate</CardTitle>
            <FontAwesomeIcon icon="gauge-high" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.efficiency || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Utilization</CardTitle>
            <FontAwesomeIcon icon="recycle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.materialUtilization || 0}%</div>
            <p className="text-xs text-muted-foreground">Material efficiency</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {machines.map((machine) => (
              <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)}`} />
                  <div>
                    <h4 className="font-medium">{machine.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {machine.type.toUpperCase()} - {machine.currentJob || 'No active job'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {machine.progress !== undefined && (
                    <div className="w-32">
                      <Progress value={machine.progress} className="h-2" />
                    </div>
                  )}
                  <Badge variant="outline">
                    Queue: {machine.queueLength}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <FontAwesomeIcon icon="ellipsis-h" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
