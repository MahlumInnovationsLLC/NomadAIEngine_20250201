```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDumbbell,
  faPersonRunning,
  faChartLine,
  faBrain,
  faFire,
  faHeartPulse,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface Exercise {
  id: string;
  name: string;
  type: "strength" | "cardio" | "flexibility" | "balance";
  difficulty: "beginner" | "intermediate" | "advanced";
  targetMuscles: string[];
  sets: number;
  reps: number;
  duration?: string;
  restPeriod: string;
  equipment?: string[];
  aiRecommendation?: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  caloriesBurn: number;
  exercises: Exercise[];
  userProgress: number;
  aiInsights?: string[];
}

// Mock data for demonstration
const mockWorkoutPlans: WorkoutPlan[] = [
  {
    id: "1",
    name: "Strength Building Program",
    type: "Strength Training",
    difficulty: "intermediate",
    duration: "45 minutes",
    caloriesBurn: 350,
    userProgress: 65,
    exercises: [
      {
        id: "e1",
        name: "Barbell Squats",
        type: "strength",
        difficulty: "intermediate",
        targetMuscles: ["quadriceps", "hamstrings", "glutes"],
        sets: 4,
        reps: 8,
        restPeriod: "90 seconds",
        equipment: ["barbell", "squat rack"],
        aiRecommendation: "Focus on depth and form to maximize muscle engagement"
      },
      {
        id: "e2",
        name: "Bench Press",
        type: "strength",
        difficulty: "intermediate",
        targetMuscles: ["chest", "shoulders", "triceps"],
        sets: 3,
        reps: 10,
        restPeriod: "60 seconds",
        equipment: ["bench", "barbell"],
        aiRecommendation: "Maintain controlled movement for better chest activation"
      },
      {
        id: "e3",
        name: "Romanian Deadlifts",
        type: "strength",
        difficulty: "intermediate",
        targetMuscles: ["hamstrings", "lower back", "glutes"],
        sets: 4,
        reps: 12,
        restPeriod: "90 seconds",
        equipment: ["barbell"],
        aiRecommendation: "Keep slight bend in knees throughout movement"
      }
    ],
    aiInsights: [
      "Your form has improved 20% since last week",
      "Consider increasing weight on squats based on recent performance",
      "Recovery metrics suggest you're ready for higher intensity"
    ]
  }
];

export function WorkoutRecommendationEngine() {
  const [selectedPlan] = useState<WorkoutPlan>(mockWorkoutPlans[0]);
  const [activeTab, setActiveTab] = useState("current");

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faDumbbell} className="h-5 w-5 text-blue-500" />
            AI Workout Engine
          </CardTitle>
          <Badge variant="secondary" className="animate-pulse">
            AI Optimizing
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue={activeTab} className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="current">Current Plan</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.type} • {selectedPlan.duration} • {selectedPlan.caloriesBurn} kcal
                  </p>
                </div>
                <Badge variant="outline">{selectedPlan.difficulty}</Badge>
              </div>

              <div className="space-y-4">
                {selectedPlan.exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exercise.targetMuscles.join(", ")}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {exercise.sets} × {exercise.reps}
                      </Badge>
                    </div>

                    {exercise.aiRecommendation && (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon
                          icon={faBrain}
                          className="h-4 w-4 mt-1 text-purple-500"
                        />
                        <p className="text-sm">{exercise.aiRecommendation}</p>
                      </div>
                    )}

                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faFire} className="h-3 w-3" />
                        Rest: {exercise.restPeriod}
                      </span>
                      {exercise.equipment && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faDumbbell} className="h-3 w-3" />
                          {exercise.equipment.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h3 className="font-medium">Overall Progress</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span>{selectedPlan.userProgress}%</span>
                  </div>
                  <Progress value={selectedPlan.userProgress} />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">AI Insights</h4>
                {selectedPlan.aiInsights?.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                  >
                    <FontAwesomeIcon
                      icon={faBrain}
                      className="h-4 w-4 mt-1 text-purple-500"
                    />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faHeartPulse}
                      className="h-4 w-4 text-red-500"
                    />
                    <h4 className="font-medium">Intensity Level</h4>
                  </div>
                  <Progress value={75} className="bg-red-100" />
                  <p className="text-sm text-muted-foreground">
                    Optimal zone for your goals
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="h-4 w-4 text-green-500"
                    />
                    <h4 className="font-medium">Strength Gains</h4>
                  </div>
                  <Progress value={60} className="bg-green-100" />
                  <p className="text-sm text-muted-foreground">
                    15% increase this month
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-4">
          <Button className="flex-1 gap-2">
            <FontAwesomeIcon icon={faPersonRunning} className="h-4 w-4" />
            Start Workout
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
            Adjust Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```
