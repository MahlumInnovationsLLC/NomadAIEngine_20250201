import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faChartLine, faCircleCheck, faDumbbell, faHeartPulse } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface CoachingInsight {
  id: string;
  type: "workout" | "nutrition" | "recovery" | "lifestyle";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  progress?: number;
  action?: string;
}

const mockInsights: CoachingInsight[] = [
  {
    id: "1",
    type: "workout",
    title: "Increase Workout Intensity",
    description: "Based on your heart rate data, you're ready to increase your workout intensity. Consider adding HIIT sessions.",
    priority: "high",
    progress: 65,
    action: "View HIIT Workouts"
  },
  {
    id: "2",
    type: "nutrition",
    title: "Protein Intake Optimization",
    description: "Your current protein intake is below optimal for muscle recovery. Aim for 1.6-2.2g per kg of body weight.",
    priority: "medium",
    progress: 45,
    action: "View Meal Plans"
  },
  {
    id: "3",
    type: "recovery",
    title: "Sleep Quality Enhancement",
    description: "Your sleep patterns show room for improvement. Try to maintain consistent sleep schedule.",
    priority: "high",
    progress: 30,
    action: "Sleep Tips"
  },
  {
    id: "4",
    type: "lifestyle",
    title: "Stress Management",
    description: "High stress levels detected from heart rate variability. Consider adding meditation to your routine.",
    priority: "medium",
    action: "Start Meditation"
  }
];

export function AICoach() {
  const [insights] = useState<CoachingInsight[]>(mockInsights);

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
        return faHeartPulse;
      case "recovery":
        return faCircleCheck;
      case "lifestyle":
        return faChartLine;
      default:
        return faBrain;
    }
  };

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
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 border rounded-lg space-y-3 relative overflow-hidden"
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

              {insight.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{insight.progress}%</span>
                  </div>
                  <Progress value={insight.progress} />
                </div>
              )}

              {insight.action && (
                <Button variant="outline" size="sm" className="w-full">
                  {insight.action}
                </Button>
              )}
            </div>
          ))}
        </div>

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
