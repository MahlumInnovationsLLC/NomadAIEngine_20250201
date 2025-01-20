import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PredictionResponse {
  equipment: {
    id: string;
    name: string;
  };
  predictions: Array<{
    timestamp: string;
    predictedUsage: number;
    confidence: number;
  }>;
  lastUpdated: string;
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
            <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error loading predictions'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Transform the prediction data for the chart
  const chartData = prediction.predictions.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric',
      hour12: true 
    }),
    usage: p.predictedUsage,
    confidence: p.confidence
  }));

  // Calculate average usage and confidence
  const avgUsage = chartData.reduce((acc, curr) => acc + curr.usage, 0) / chartData.length;
  const avgConfidence = chartData.reduce((acc, curr) => acc + curr.confidence, 0) / chartData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  interval={3}  // Show every 4th label to prevent overcrowding
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Predicted Usage %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Usage:</span>
              <span>{avgUsage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prediction Confidence:</span>
              <span>{(avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(prediction.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}