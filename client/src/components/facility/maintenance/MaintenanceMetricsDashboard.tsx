import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";

export default function MaintenanceMetricsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: metrics } = useQuery({
    queryKey: ['/api/maintenance/metrics', timeRange],
    enabled: true,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Maintenance Performance Metrics</span>
            <div className="flex gap-2">
              <Button 
                variant={timeRange === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button 
                variant={timeRange === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button 
                variant={timeRange === 'quarter' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('quarter')}
              >
                Quarter
              </Button>
              <Button 
                variant={timeRange === 'year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">PM Compliance</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completed on Schedule</span>
                      <span className="font-medium">{metrics?.pmCompliance || 0}%</span>
                    </div>
                    <Progress value={metrics?.pmCompliance || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Mean Time Between Failures</div>
                  <div className="text-2xl font-bold">{metrics?.mtbf || 0} days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Mean Time To Repair</div>
                  <div className="text-2xl font-bold">{metrics?.mttr || 0} hours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Overall Equipment Effectiveness</div>
                  <div className="text-2xl font-bold">{metrics?.oee || 0}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Labor</span>
                      <span className="font-medium">${metrics?.costs?.labor || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Parts</span>
                      <span className="font-medium">${metrics?.costs?.parts || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>External Services</span>
                      <span className="font-medium">${metrics?.costs?.services || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total</span>
                      <span className="font-medium">${metrics?.costs?.total || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Work Order Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Planned Maintenance</span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                        {metrics?.workOrders?.planned || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Reactive Maintenance</span>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        {metrics?.workOrders?.reactive || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Emergency Repairs</span>
                      <Badge variant="outline" className="bg-red-500/10 text-red-500">
                        {metrics?.workOrders?.emergency || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total Work Orders</span>
                      <span className="font-medium">{metrics?.workOrders?.total || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
