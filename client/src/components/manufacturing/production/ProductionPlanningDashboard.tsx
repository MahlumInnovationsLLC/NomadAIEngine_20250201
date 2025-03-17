import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { DailyProductionPlan } from "./planning/DailyProductionPlan";
import { WeeklyProductionPlan } from "./planning/WeeklyProductionPlan";
import { MonthlyProductionPlan } from "./planning/MonthlyProductionPlan";

type PlanningPeriod = "daily" | "weekly" | "monthly";

export interface ProductionPlanningDashboardProps {
  productionLineId?: string;
}

export function ProductionPlanningDashboard({ productionLineId }: ProductionPlanningDashboardProps) {
  const [planningPeriod, setPlanningPeriod] = useState<PlanningPeriod>("daily");
  
  // Fetch production lines if no specific line ID is provided
  const { data: productionLines = [] } = useQuery({
    queryKey: ['/api/manufacturing/production-lines'],
    enabled: !productionLineId,
  });

  // Fetch production stats summary
  const { data: productionStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/manufacturing/stats'],
    refetchInterval: 60000, // refresh every minute
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Production Planning</h2>
          <p className="text-muted-foreground">
            Schedule, optimize, and track production activities across all time horizons
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New Production Plan
        </Button>
      </div>

      {/* Production Planning KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Production Efficiency</p>
                <h3 className="text-2xl font-bold">{productionStats?.efficiency || 0}%</h3>
              </div>
              <FontAwesomeIcon icon="gauge-high" className="h-8 w-8 text-primary" />
            </div>
            <Progress value={productionStats?.efficiency || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-Time Delivery</p>
                <h3 className="text-2xl font-bold">{productionStats?.onTimeDelivery || 0}%</h3>
              </div>
              <FontAwesomeIcon icon="truck-clock" className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={productionStats?.onTimeDelivery || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacity Utilization</p>
                <h3 className="text-2xl font-bold">{productionStats?.capacityUtilization || 0}%</h3>
              </div>
              <FontAwesomeIcon icon="chart-pie" className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={productionStats?.capacityUtilization || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Availability</p>
                <h3 className="text-2xl font-bold">{productionStats?.materialAvailability || 0}%</h3>
              </div>
              <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={productionStats?.materialAvailability || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Production Planning Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Production Planning</CardTitle>
          <CardDescription>
            Manage production schedules across different time horizons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue={planningPeriod} 
            value={planningPeriod} 
            onValueChange={(value) => setPlanningPeriod(value as PlanningPeriod)}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="daily">
                <FontAwesomeIcon icon="calendar-day" className="mr-2 h-4 w-4" />
                Daily Plans
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <FontAwesomeIcon icon="calendar-week" className="mr-2 h-4 w-4" />
                Weekly Plans
              </TabsTrigger>
              <TabsTrigger value="monthly">
                <FontAwesomeIcon icon="calendar-alt" className="mr-2 h-4 w-4" />
                Monthly Plans
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-0">
              <DailyProductionPlan productionLineId={productionLineId} />
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-0">
              <WeeklyProductionPlan productionLineId={productionLineId} />
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-0">
              <MonthlyProductionPlan productionLineId={productionLineId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}