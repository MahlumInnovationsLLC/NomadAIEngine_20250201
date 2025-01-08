import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface PredictiveUsageProps {
  equipmentId: number;
}

interface PredictiveUsageData {
  currentCapacity: number;
  predictedPeakTime: string;
  predictedQuietTime: string;
  utilizationRate: number;
  recommendations: string[];
  nextPeakIn: number; // minutes
}

export default function PredictiveUsageMiniDashboard({ equipmentId }: PredictiveUsageProps) {
  const { data, isLoading, isError } = useQuery<PredictiveUsageData>({
    queryKey: [`/api/equipment/${equipmentId}/predictive-usage`],
    retry: 2
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Predictive Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Predictive Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load predictive usage data
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Predictive Usage Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Current Capacity</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{data.currentCapacity}%</span>
              <Progress value={data.currentCapacity} className="ml-2 w-20" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Next Peak</span>
            </div>
            <span className="text-sm font-medium">
              {data.nextPeakIn < 60 
                ? `${data.nextPeakIn}m` 
                : `${Math.floor(data.nextPeakIn / 60)}h ${data.nextPeakIn % 60}m`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Utilization Rate</span>
            </div>
            <span className="font-medium">{data.utilizationRate}%</span>
          </div>

          <div className="space-y-2 border-t pt-2">
            <span className="text-xs font-medium">Recommendations</span>
            <ul className="space-y-1">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="text-xs text-muted-foreground">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
