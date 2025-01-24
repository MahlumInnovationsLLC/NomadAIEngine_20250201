import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain,
  faChartLine,
  faCircleCheck,
  faDumbbell,
  faHeartPulse,
  faCarrot,
  faMoon,
  faRotate,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface CoachingInsight {
  id: string;
  type: "workout" | "nutrition" | "recovery" | "lifestyle";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  progress?: number;
  action?: string;
  recommendations: string[];
  metrics?: {
    label: string;
    value: number;
    target: number;
    unit: string;
  }[];
  timestamp: string;
}

interface AICoachProps {
  memberId: string;
  memberMetrics: any;
  onDataUpdate: (updates: any) => Promise<void>;
}

export function AICoach({ memberId, memberMetrics, onDataUpdate }: AICoachProps) {
  const [selectedInsight, setSelectedInsight] = useState<CoachingInsight | null>(null);

  // Fetch AI-generated insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/ai-insights', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/ai-insights/${memberId}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
  });

  const getPriorityColor = (priority: CoachingInsight["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getTypeIcon = (type: CoachingInsight["type"]) => {
    switch (type) {
      case "workout":
        return faDumbbell;
      case "nutrition":
        return faCarrot;
      case "recovery":
        return faMoon;
      case "lifestyle":
        return faChartLine;
      default:
        return faBrain;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <FontAwesomeIcon icon={faRotate} className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBrain} className="h-5 w-5 text-purple-500" />
            AI Wellness Coach
          </CardTitle>
          <Badge variant="secondary" className="animate-pulse">
            AI Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {insights?.map((insight: CoachingInsight) => (
            <div
              key={insight.id}
              className="p-4 border rounded-lg space-y-3 relative overflow-hidden cursor-pointer hover:bg-accent/5"
              onClick={() => setSelectedInsight(insight)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={getTypeIcon(insight.type)}
                    className={`h-4 w-4 ${getPriorityColor(insight.priority)}`}
                  />
                  <span className="font-medium">{insight.title}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(insight.priority)} capitalize`}
                >
                  {insight.priority} priority
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {insight.description}
              </p>

              {insight.metrics && (
                <div className="grid gap-4 md:grid-cols-2">
                  {insight.metrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.label}</span>
                        <span>
                          {metric.value}/{metric.target} {metric.unit}
                        </span>
                      </div>
                      <Progress
                        value={(metric.value / metric.target) * 100}
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              )}

              {insight.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{insight.progress}%</span>
                  </div>
                  <Progress value={insight.progress} />
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {format(new Date(insight.timestamp), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        {selectedInsight && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{selectedInsight.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInsight(null)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {selectedInsight.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="h-4 w-4 mt-1 text-green-500"
                      />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInsight.action && (
                <Button className="w-full gap-2">
                  <FontAwesomeIcon
                    icon={getTypeIcon(selectedInsight.type)}
                    className="h-4 w-4"
                  />
                  {selectedInsight.action}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <Button className="flex-1 gap-2">
            <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
            Get Personalized Plan
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
            View All Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}