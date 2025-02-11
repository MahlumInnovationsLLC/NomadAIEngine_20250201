import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SupplierPerformanceData } from "@/types/material";

interface SupplierPerformanceHistoryProps {
  supplierId: string;
}

export function SupplierPerformanceHistory({ supplierId }: SupplierPerformanceHistoryProps) {
  const { data: performanceHistory = [] } = useQuery<SupplierPerformanceData[]>({
    queryKey: ['/api/material/supplier-performance', supplierId],
    enabled: !!supplierId,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="qualityScore" 
                  name="Quality Score"
                  stroke="#22c55e" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="deliveryPerformance" 
                  name="Delivery Performance"
                  stroke="#3b82f6" 
                />
                <Line 
                  type="monotone" 
                  dataKey="costCompetitiveness" 
                  name="Cost Competitiveness"
                  stroke="#f59e0b" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceHistory.slice(-1).map((latest) => (
                <div key="quality-metrics" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Defect Rate</span>
                      <span className="text-sm font-medium">{latest.defectRate}%</span>
                    </div>
                    <Progress value={100 - latest.defectRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Inspection Pass Rate</span>
                      <span className="text-sm font-medium">{latest.inspectionPassRate}%</span>
                    </div>
                    <Progress value={latest.inspectionPassRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Documentation Accuracy</span>
                      <span className="text-sm font-medium">{latest.documentationAccuracy}%</span>
                    </div>
                    <Progress value={latest.documentationAccuracy} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceHistory.slice(-1).map((latest) => (
                <div key="delivery-metrics" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Lead Time</span>
                    <span className="text-sm font-medium">{latest.averageLeadTime} days</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">On-Time Delivery Rate</span>
                    <Badge className={
                      latest.onTimeDeliveryRate >= 90 ? 'bg-green-500' :
                      latest.onTimeDeliveryRate >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }>
                      {latest.onTimeDeliveryRate}%
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Order Fill Rate</span>
                    <Badge variant="outline" className={
                      latest.orderFillRate >= 90 ? 'bg-green-500/10 text-green-500' :
                      latest.orderFillRate >= 75 ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }>
                      {latest.orderFillRate}%
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm font-medium">{latest.responseTime}h avg.</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceHistory.slice(-1).map((latest) => (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Price Variance</div>
                  <div className="text-2xl font-bold">
                    {latest.priceVariance > 0 ? '+' : ''}{latest.priceVariance}%
                  </div>
                  <div className="text-sm text-muted-foreground">vs. Market Average</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Cost Savings</div>
                  <div className="text-2xl font-bold text-green-500">
                    ${latest.costSavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">YTD</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                  <div className="text-2xl font-bold">
                    ${latest.totalSpend.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Last 12 Months</div>
                </div>
              </>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}