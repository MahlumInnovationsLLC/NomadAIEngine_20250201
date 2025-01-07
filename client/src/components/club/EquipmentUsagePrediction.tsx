import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface UsagePrediction {
  equipment_id: number;
  timestamp: string;
  predicted_usage: number;
  confidence: number;
}

interface EquipmentUsagePredictionProps {
  equipmentId: number;
}

export default function EquipmentUsagePrediction({ equipmentId }: EquipmentUsagePredictionProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const { data: predictions, isLoading, isError } = useQuery<UsagePrediction[]>({
    queryKey: ['/api/equipment/predictions', equipmentId, timeRange],
  });

  const generatePredictionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}/generate-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange }),
      });
      if (!response.ok) throw new Error('Failed to generate prediction');
      return response.json();
    },
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

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading predictions</p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = predictions?.map(pred => ({
    timestamp: new Date(pred.timestamp).toLocaleDateString(),
    usage: pred.predicted_usage,
    confidence: pred.confidence,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Usage Prediction</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={timeRange === '24h' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTimeRange('24h')}
          >
            24h
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={timeRange === '7d' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTimeRange('7d')}
          >
            7d
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={timeRange === '30d' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTimeRange('30d')}
          >
            30d
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => generatePredictionMutation.mutate()}
            disabled={generatePredictionMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${generatePredictionMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="hsl(var(--primary))"
                name="Predicted Usage"
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
