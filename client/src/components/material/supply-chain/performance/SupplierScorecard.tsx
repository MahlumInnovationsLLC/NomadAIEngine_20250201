import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SupplierPerformanceData } from "@/types/material";

interface SupplierScorecardProps {
  supplierId: string;
}

export function SupplierScorecard({ supplierId }: SupplierScorecardProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof SupplierPerformanceData>("qualityScore");
  
  const { data: performance } = useQuery<SupplierPerformanceData[]>({
    queryKey: ['/api/material/supplier-performance', supplierId],
    enabled: !!supplierId,
  });

  const calculateOverallScore = (data: SupplierPerformanceData) => {
    const weights = {
      qualityScore: 0.3,
      deliveryPerformance: 0.3,
      costCompetitiveness: 0.2,
      responseTime: 0.1,
      documentationAccuracy: 0.1,
    };

    return Math.round(
      (data.qualityScore * weights.qualityScore +
      data.deliveryPerformance * weights.deliveryPerformance +
      data.costCompetitiveness * weights.costCompetitiveness +
      data.responseTime * weights.responseTime +
      data.documentationAccuracy * weights.documentationAccuracy) * 100
    ) / 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "qualityScore":
        return ["fas", "star"];
      case "deliveryPerformance":
        return ["fas", "truck"];
      case "costCompetitiveness":
        return ["fas", "dollar-sign"];
      case "responseTime":
        return ["fas", "clock"];
      case "documentationAccuracy":
        return ["fas", "file-check"];
      default:
        return ["fas", "chart-line"];
    }
  };

  const latestData = performance?.[performance.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            {latestData && (
              <div className="text-center">
                <span className={`text-4xl font-bold ${getScoreColor(calculateOverallScore(latestData))}`}>
                  {calculateOverallScore(latestData)}%
                </span>
                <Progress value={calculateOverallScore(latestData)} className="mt-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            {latestData && (
              <div className="text-center">
                <span className={`text-4xl font-bold ${getScoreColor(latestData.qualityScore)}`}>
                  {latestData.qualityScore}%
                </span>
                <Progress value={latestData.qualityScore} className="mt-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {latestData && (
              <div className="text-center">
                <span className={`text-4xl font-bold ${getScoreColor(latestData.deliveryPerformance)}`}>
                  {latestData.deliveryPerformance}%
                </span>
                <Progress value={latestData.deliveryPerformance} className="mt-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Performance Trends</CardTitle>
            <div className="flex gap-2">
              {Object.keys(latestData || {}).filter(key => 
                typeof latestData?.[key as keyof SupplierPerformanceData] === 'number' &&
                key !== 'period'
              ).map((metric) => (
                <Button
                  key={metric}
                  variant={selectedMetric === metric ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric(metric as keyof SupplierPerformanceData)}
                >
                  <FontAwesomeIcon 
                    icon={getMetricIcon(metric)} 
                    className="mr-2 h-4 w-4"
                  />
                  {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performance}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Current Score</TableHead>
                <TableHead>Previous Score</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance && performance.length >= 2 && Object.entries(performance[performance.length - 1])
                .filter(([key, value]) => typeof value === 'number' && key !== 'period')
                .map(([key, currentValue]) => {
                  const previousValue = performance[performance.length - 2][key as keyof SupplierPerformanceData];
                  const trend = (currentValue as number) - (previousValue as number);
                  
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={getMetricIcon(key)} 
                            className={getScoreColor(currentValue as number)}
                          />
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                      </TableCell>
                      <TableCell>{currentValue}%</TableCell>
                      <TableCell>{previousValue}%</TableCell>
                      <TableCell>
                        <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
                          <FontAwesomeIcon 
                            icon={trend >= 0 ? ["fas", "arrow-up"] : ["fas", "arrow-down"]} 
                            className="mr-1"
                          />
                          {Math.abs(trend).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>95%</TableCell>
                    </TableRow>
                  );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
