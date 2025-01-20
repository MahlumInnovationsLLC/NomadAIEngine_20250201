import { Equipment } from "@db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MaintenanceTimeline } from "./MaintenanceTimeline";

export function EquipmentHealthDashboard() {
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  if (isLoading) {
    return <div>Loading health data...</div>;
  }

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Good", color: "text-green-500", bgColor: "bg-green-500/10" };
    if (score >= 60) return { label: "Fair", color: "text-yellow-500", bgColor: "bg-yellow-500/10" };
    return { label: "Poor", color: "text-red-500", bgColor: "bg-red-500/10" };
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

  const calculateRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Low', color: 'emerald' };
    if (score >= 60) return { level: 'Medium', color: 'yellow' };
    return { level: 'High', color: 'red' };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Equipment Health Overview
            </CardTitle>
            <FontAwesomeIcon icon="arrow-trend-up" className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Required
            </CardTitle>
            <FontAwesomeIcon icon="triangle-exclamation" className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Healthy Equipment
            </CardTitle>
            <FontAwesomeIcon icon="circle-check" className="h-4 w-4 text-muted-foreground" />
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

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Risk Analysis</CardTitle>
          <CardDescription>
            Real-time visualization of equipment risk levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {equipment.map((eq) => {
              const riskInfo = calculateRiskLevel(Number(eq.maintenanceScore || eq.healthScore));
              const pulseAnimation = riskInfo.level === 'High' ? {
                scale: [1, 1.02, 1],
                opacity: [0.8, 1, 0.8],
              } : {};

              return (
                <motion.div
                  key={eq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    ...pulseAnimation
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: riskInfo.level === 'High' ? Infinity : 0,
                    repeatType: "reverse"
                  }}
                  className={`p-4 rounded-lg bg-${riskInfo.color}-50 border border-${riskInfo.color}-200`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{eq.name}</h3>
                    <Badge variant={riskInfo.level === 'High' ? 'destructive' : 'outline'}>
                      {riskInfo.level} Risk
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Maintenance Score</span>
                      <span className={`text-${riskInfo.color}-600 font-medium`}>
                        {Math.round(Number(eq.maintenanceScore || eq.healthScore))}%
                      </span>
                    </div>
                    <Progress 
                      value={Number(eq.maintenanceScore || eq.healthScore)} 
                      className={`h-2 bg-${riskInfo.color}-100`}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <FontAwesomeIcon icon="calendar-days" className="h-3 w-3" />
                      Next maintenance: {
                        eq.nextMaintenance 
                          ? new Date(eq.nextMaintenance).toLocaleDateString()
                          : 'Not scheduled'
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                <motion.div 
                  key={eq.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
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
                      <FontAwesomeIcon icon="calendar-days" className="h-3 w-3" />
                      Next predicted maintenance: {predictedMaintenance.toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <MaintenanceTimeline equipment={equipment} />

      {requiresAttention.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Maintenance Alerts</h3>
          {requiresAttention.map((eq) => (
            <motion.div
              key={eq.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <FontAwesomeIcon icon="triangle-exclamation" className="h-4 w-4" />
                <AlertTitle>Maintenance Required</AlertTitle>
                <AlertDescription>
                  {eq.name} needs attention. Current health score: {eq.healthScore}%.
                  {eq.maintenanceNotes && (
                    <p className="mt-2 text-sm">Note: {eq.maintenanceNotes}</p>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}