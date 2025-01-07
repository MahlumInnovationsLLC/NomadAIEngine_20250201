import { Equipment } from "@db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Activity, Calendar, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function EquipmentHealthDashboard() {
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  if (isLoading) {
    return <div>Loading health data...</div>;
  }

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Good", color: "text-green-500" };
    if (score >= 60) return { label: "Fair", color: "text-yellow-500" };
    return { label: "Poor", color: "text-red-500" };
  };

  const getPredictedMaintenanceDate = (equipment: Equipment) => {
    const lastMaintenance = equipment.lastMaintenance ? new Date(equipment.lastMaintenance) : null;
    const healthScore = Number(equipment.healthScore);
    
    if (!lastMaintenance) return new Date();
    
    // Simple prediction logic based on health score
    const daysToAdd = healthScore >= 80 ? 90 : healthScore >= 60 ? 45 : 15;
    const predictedDate = new Date(lastMaintenance);
    predictedDate.setDate(predictedDate.getDate() + daysToAdd);
    return predictedDate;
  };

  const requiresAttention = equipment.filter(
    eq => Number(eq.healthScore) < 70 || eq.status === 'maintenance'
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Overall Health Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Equipment Health Overview
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                equipment.reduce((acc, eq) => acc + Number(eq.healthScore), 0) / 
                equipment.length
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average health score across all equipment
            </p>
          </CardContent>
        </Card>

        {/* Maintenance Needed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Required
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requiresAttention.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Equipment items requiring attention
            </p>
          </CardContent>
        </Card>

        {/* Healthy Equipment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Healthy Equipment
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter(eq => Number(eq.healthScore) >= 70).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Equipment in good condition
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Health Details */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Health Status</CardTitle>
          <CardDescription>
            Detailed health information for all equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {equipment.map((eq) => {
              const healthStatus = getHealthStatus(Number(eq.healthScore));
              const predictedMaintenance = getPredictedMaintenanceDate(eq);
              const needsMaintenance = predictedMaintenance < new Date();

              return (
                <div key={eq.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{eq.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Health Score: {eq.healthScore}%
                      </p>
                    </div>
                    <Badge variant={needsMaintenance ? "destructive" : "outline"}>
                      {needsMaintenance ? "Maintenance Due" : "Healthy"}
                    </Badge>
                  </div>
                  <Progress value={Number(eq.healthScore)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={healthStatus.color}>{healthStatus.label}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Next predicted maintenance: {predictedMaintenance.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Alerts */}
      {requiresAttention.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Maintenance Alerts</h3>
          {requiresAttention.map((eq) => (
            <Alert key={eq.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Maintenance Required</AlertTitle>
              <AlertDescription>
                {eq.name} needs attention. Current health score: {eq.healthScore}%.
                {eq.maintenanceNotes && (
                  <p className="mt-2 text-sm">Note: {eq.maintenanceNotes}</p>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
