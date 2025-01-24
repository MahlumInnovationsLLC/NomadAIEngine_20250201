import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faCarrot, faBrain, faChartLine, faPersonRunning } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { HealthMetrics } from "./HealthMetrics";
import { AICoach } from "./AICoach";
import { NutritionPlanGenerator } from "./NutritionPlanGenerator";
import { MilestoneTracker } from "./MilestoneTracker";
import { WorkoutRecommendationEngine } from "./WorkoutRecommendationEngine";

export function PersonalizedExperience() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Personalized Experience</h2>
          <p className="text-muted-foreground">
            AI-powered workout plans, nutrition recommendations, and personalized coaching
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Health Metrics - Full Width on Small Screens */}
        <div className="lg:col-span-3">
          <HealthMetrics />
        </div>

        {/* Workout Recommendation Engine */}
        <div className="lg:col-span-1">
          <WorkoutRecommendationEngine />
        </div>

        {/* AI Coach */}
        <div className="lg:col-span-1">
          <AICoach />
        </div>

        {/* Nutrition Plan Generator */}
        <div className="lg:col-span-1">
          <NutritionPlanGenerator />
        </div>

        {/* Milestone Tracker - Full Width */}
        <div className="lg:col-span-3">
          <MilestoneTracker />
        </div>
      </div>
    </div>
  );
}