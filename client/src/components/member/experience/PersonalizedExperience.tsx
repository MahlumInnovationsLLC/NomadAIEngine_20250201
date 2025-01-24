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

interface WorkoutPlan {
  id: number;
  name: string;
  type: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  progress: number;
  exercises: {
    name: string;
    sets: number;
    reps: number;
  }[];
}

const mockWorkoutPlan: WorkoutPlan = {
  id: 1,
  name: "Strength Building Program",
  type: "Strength Training",
  duration: "45 minutes",
  difficulty: "intermediate",
  progress: 65,
  exercises: [
    { name: "Barbell Squats", sets: 4, reps: 8 },
    { name: "Bench Press", sets: 3, reps: 10 },
    { name: "Deadlifts", sets: 4, reps: 6 },
    { name: "Shoulder Press", sets: 3, reps: 12 },
  ],
};

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

        {/* Workout Plan */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faDumbbell} className="h-5 w-5 text-blue-500" />
                  Current Workout Plan
                </CardTitle>
                <Badge variant="secondary">{mockWorkoutPlan.difficulty}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{mockWorkoutPlan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {mockWorkoutPlan.type} • {mockWorkoutPlan.duration}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{mockWorkoutPlan.progress}%</span>
                </div>
                <Progress value={mockWorkoutPlan.progress} />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Today's Exercises</h4>
                <div className="space-y-2">
                  {mockWorkoutPlan.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm font-medium">{exercise.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {exercise.sets} sets × {exercise.reps} reps
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="w-full gap-2">
                  <FontAwesomeIcon icon={faPersonRunning} className="h-4 w-4" />
                  Start Workout
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
                  Adjust Plan
                </Button>
              </div>
            </CardContent>
          </Card>
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