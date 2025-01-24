import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faCarrot, faBrain, faChartLine, faPersonRunning } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { HealthMetrics } from "./HealthMetrics";

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
            AI-powered workout plans, nutrition recommendations, and health tracking
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

        <div className="space-y-6">
          <HealthMetrics />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCarrot} className="h-5 w-5 text-green-500" />
                Nutrition Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Today's Macro Goals</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Protein</span>
                      <span>180g</span>
                    </div>
                    <Progress value={65} className="bg-blue-100" />
                    <div className="flex justify-between text-sm">
                      <span>Carbs</span>
                      <span>250g</span>
                    </div>
                    <Progress value={45} className="bg-green-100" />
                    <div className="flex justify-between text-sm">
                      <span>Fats</span>
                      <span>65g</span>
                    </div>
                    <Progress value={80} className="bg-yellow-100" />
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2">
                  <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
                  Get Meal Suggestions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-purple-500" />
                Progress Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                    <FontAwesomeIcon icon={faBrain} className="h-4 w-4 mt-1 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm">
                        Your strength has increased by 12% in the last month. Consider
                        increasing weights in your next workout.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                    <FontAwesomeIcon icon={faBrain} className="h-4 w-4 mt-1 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm">
                        You're consistently hitting your protein goals. Great job
                        maintaining your nutrition plan!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}