import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BuildingSystem } from "@/types/facility";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PredictiveMaintenancePanelProps {
  system: BuildingSystem;
}

interface MaintenancePrediction {
  systemId: string;
  healthScore: number;
  predictedIssues: {
    component: string;
    probability: number;
    severity: 'low' | 'medium' | 'high';
    recommendedAction: string;
    estimatedTimeToFailure: number;
  }[];
  maintenanceRecommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedCost: number;
    benefitDescription: string;
  }[];
  historicalData: {
    date: string;
    performanceScore: number;
    energyEfficiency: number;
    maintenanceCost: number;
  }[];
}

export default function PredictiveMaintenancePanel({ system }: PredictiveMaintenancePanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<'performanceScore' | 'energyEfficiency' | 'maintenanceCost'>('performanceScore');

  const { data: prediction, isLoading } = useQuery<MaintenancePrediction>({
    queryKey: [`/api/facility/predictive/${system.id}`],
  });

  if (isLoading || !prediction) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">System Health Prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Health Score</p>
              <p className={`text-2xl font-bold ${getHealthScoreColor(prediction.healthScore)}`}>
                {prediction.healthScore}%
              </p>
            </div>
            <div className="w-[200px]">
              <Progress 
                value={prediction.healthScore} 
                className={`h-2 rounded-full ${
                  prediction.healthScore >= 80 ? 'bg-green-500' : 
                  prediction.healthScore >= 60 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
              />
            </div>
          </div>

          {/* Performance Trends */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'performanceScore' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('performanceScore')}
                size="sm"
              >
                Performance
              </Button>
              <Button
                variant={selectedMetric === 'energyEfficiency' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('energyEfficiency')}
                size="sm"
              >
                Energy Efficiency
              </Button>
              <Button
                variant={selectedMetric === 'maintenanceCost' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('maintenanceCost')}
                size="sm"
              >
                Maintenance Cost
              </Button>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction.historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predicted Issues */}
      {prediction.predictedIssues && prediction.predictedIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Predicted Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prediction.predictedIssues.map((issue, index) => (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{issue.component}</p>
                    <p className="text-sm text-muted-foreground">{issue.recommendedAction}</p>
                    <p className="text-sm">
                      Estimated time to failure: {issue.estimatedTimeToFailure} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getSeverityColor(issue.severity)}`}>
                      {Math.round(issue.probability * 100)}% Risk
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {issue.severity.toUpperCase()} Severity
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Recommendations */}
      {prediction.maintenanceRecommendations && prediction.maintenanceRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prediction.maintenanceRecommendations.map((recommendation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{recommendation.action}</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      getSeverityColor(recommendation.priority)
                    }`}>
                      {recommendation.priority.toUpperCase()} Priority
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {recommendation.benefitDescription}
                  </p>
                  <p className="text-sm">
                    Estimated Cost: ${recommendation.estimatedCost.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}