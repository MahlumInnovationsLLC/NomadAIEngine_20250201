import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addDays, format, subDays } from "date-fns";

interface UsageAnalytics {
  dailyUsage: Array<{
    date: string;
    totalMinutes: number;
    sessions: number;
    peakHour: number;
    avgDuration: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    totalMinutes: number;
    sessions: number;
    mostActiveDay: string;
  }>;
  timeOfDayDistribution: Array<{
    hour: number;
    sessions: number;
    avgDuration: number;
  }>;
  utilizationRate: number;
  averageSessionDuration: number;
}

interface EquipmentUsagePredictionProps {
  equipmentId: number;
}

export default function EquipmentUsagePrediction({ equipmentId }: EquipmentUsagePredictionProps) {
  const endDate = new Date();
  const startDate = subDays(endDate, 7); // Last 7 days

  const { data: analytics, isLoading, isError, error } = useQuery<UsageAnalytics>({
    queryKey: [
      `/api/equipment/${equipmentId}/analytics`,
      `?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
    ],
    retry: 2
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error loading analytics'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Ensure the data is valid before transforming
  if (!Array.isArray(analytics.dailyUsage)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
            <AlertDescription>
              Invalid analytics data format
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Transform the analytics data for the chart
  const chartData = analytics.dailyUsage.map(day => ({
    date: format(new Date(day.date), 'MMM d'),
    usage: Math.round(day.totalMinutes / 60), // Convert to hours
    sessions: day.sessions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  interval={1}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="usage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Hours Used"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sessions"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Session Duration:</span>
                <span>{Math.round(analytics.averageSessionDuration)} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Utilization Rate:</span>
                <span>{analytics.utilizationRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peak Usage Time:</span>
                <span>
                  {analytics.timeOfDayDistribution
                    .reduce((max, curr) => curr.sessions > max.sessions ? curr : max)
                    .hour}:00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sessions (7 days):</span>
                <span>
                  {analytics.dailyUsage.reduce((sum, day) => sum + day.sessions, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}