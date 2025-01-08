import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PredictiveUsageMiniDashboard from "./PredictiveUsageMiniDashboard";

interface PredictionResponse {
  equipmentId: number;
  predictions: {
    maintenanceScore: number;
    nextFailureProbability: number;
    recommendedActions: string[];
    usagePattern: {
      morning: number;
      afternoon: number;
      evening: number;
    };
  };
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

  // Transform the prediction data for the chart
  const chartData = [
    { time: '06:00', usage: prediction.predictions.usagePattern.morning },
    { time: '14:00', usage: prediction.predictions.usagePattern.afternoon },
    { time: '20:00', usage: prediction.predictions.usagePattern.evening }
  ];

  return (
    <div className="space-y-4">
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
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Predicted Usage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance Score:</span>
                <span>{prediction.predictions.maintenanceScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failure Probability:</span>
                <span>{(prediction.predictions.nextFailureProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-muted-foreground">Recommended Actions:</span>
                <ul className="list-disc list-inside space-y-1">
                  {prediction.predictions.recommendedActions.map((action, index) => (
                    <li key={index} className="text-sm">{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PredictiveUsageMiniDashboard equipmentId={equipmentId} />
    </div>
  );
}