import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PredictionResponse {
  usageHours: number;
  peakTimes: string[];
  maintenanceRecommendation: string;
  nextPredictedMaintenance: string;
}

interface EquipmentUsagePredictionProps {
  equipmentId: number;
}

export default function EquipmentUsagePrediction({ equipmentId }: EquipmentUsagePredictionProps) {
  const { data: prediction, isLoading, isError, error } = useQuery<PredictionResponse>({
    queryKey: [`/api/equipment/${equipmentId}/predictions`],
    retry: 2
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error loading predictions'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Now that we know prediction exists, we can safely use it
  const fullChartData = Array.from({ length: 24 }, (_, i) => {
    const hour = `${i}:00`;
    const isPeakHour = prediction.peakTimes.some(time => 
      parseInt(time.split(':')[0]) === i
    );

    return {
      hour,
      usage: isPeakHour ? prediction.usageHours : Math.floor(prediction.usageHours * 0.3)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer>
              <LineChart data={fullChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour"
                  interval={3} 
                  tickFormatter={(value) => value.split(':')[0]}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Predicted Usage (hours)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peak Hours:</span>
              <span>{prediction.peakTimes.join(' & ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Usage:</span>
              <span>{prediction.usageHours} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance:</span>
              <span>{prediction.maintenanceRecommendation}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}