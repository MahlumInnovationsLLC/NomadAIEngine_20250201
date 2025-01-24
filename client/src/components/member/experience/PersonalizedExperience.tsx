import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faCarrot, faBrain, faChartLine, faPersonRunning } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthMetrics } from "./HealthMetrics";
import { AICoach } from "./AICoach";
import { NutritionPlanGenerator } from "./NutritionPlanGenerator";
import { MilestoneTracker } from "./MilestoneTracker";
import { WorkoutRecommendationEngine } from "./WorkoutRecommendationEngine";

export function PersonalizedExperience() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Personalized Experience</h2>
        <p className="text-muted-foreground">
          AI-powered workout plans, nutrition recommendations, and personalized coaching
        </p>
      </div>

      <div className="space-y-6">
        {/* Health Metrics - Full Width */}
        <div>
          <HealthMetrics />
        </div>

        {/* AI Components in Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="workout" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="workout" className="gap-2">
                  <FontAwesomeIcon icon={faDumbbell} className="h-4 w-4" />
                  Workout Engine
                </TabsTrigger>
                <TabsTrigger value="coach" className="gap-2">
                  <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
                  Wellness Coach
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="gap-2">
                  <FontAwesomeIcon icon={faCarrot} className="h-4 w-4" />
                  Nutrition Planner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workout">
                <WorkoutRecommendationEngine />
              </TabsContent>

              <TabsContent value="coach">
                <AICoach />
              </TabsContent>

              <TabsContent value="nutrition">
                <NutritionPlanGenerator />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Milestone Tracker - Full Width */}
        <div>
          <MilestoneTracker />
        </div>
      </div>
    </div>
  );
}