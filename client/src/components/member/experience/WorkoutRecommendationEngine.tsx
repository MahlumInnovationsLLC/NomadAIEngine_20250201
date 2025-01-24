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
  faCircleCheck,
  faWarning,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

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
  formGuidance?: string[];
  commonMistakes?: string[];
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
  progressData?: {
    date: string;
    weight?: number;
    reps?: number;
    duration?: number;
  }[];
}

interface WorkoutRecommendationEngineProps {
  memberId: string;
  workoutData: any[];
  onDataUpdate: (updates: any) => Promise<void>;
}

export function WorkoutRecommendationEngine({ memberId, workoutData, onDataUpdate }: WorkoutRecommendationEngineProps) {
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [activeTab, setActiveTab] = useState("current");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Fetch personalized workout plan
  const { data: workoutPlan, isLoading } = useQuery({
    queryKey: ['/api/workout-plans', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/workout-plans/${memberId}`);
      if (!response.ok) throw new Error('Failed to fetch workout plan');
      return response.json();
    },
  });

  useEffect(() => {
    if (workoutPlan) {
      setSelectedPlan(workoutPlan);
    }
  }, [workoutPlan]);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-500";
    if (progress >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading || !selectedPlan) {
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
            <TabsTrigger value="form">Form Guide</TabsTrigger>
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
                    className="p-4 border rounded-lg space-y-3 cursor-pointer hover:bg-accent/5"
                    onClick={() => setSelectedExercise(exercise)}
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
                    <span className={getProgressColor(selectedPlan.userProgress)}>
                      {selectedPlan.userProgress}%
                    </span>
                  </div>
                  <Progress value={selectedPlan.userProgress} />
                </div>
              </div>

              {selectedPlan.progressData && (
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-medium">Progress Tracking</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedPlan.progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="Weight (lbs)" />
                        <Line type="monotone" dataKey="reps" stroke="#10b981" name="Reps" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

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
            </div>
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            {selectedExercise ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selectedExercise.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedExercise(null)}>
                    Back to exercises
                  </Button>
                </div>

                {selectedExercise.formGuidance && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Proper Form Guide</h4>
                    <div className="space-y-2">
                      {selectedExercise.formGuidance.map((step, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="h-4 w-4 mt-1 text-green-500"
                          />
                          <p className="text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExercise.commonMistakes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Common Mistakes to Avoid</h4>
                    <div className="space-y-2">
                      {selectedExercise.commonMistakes.map((mistake, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <FontAwesomeIcon
                            icon={faWarning}
                            className="h-4 w-4 mt-1 text-yellow-500"
                          />
                          <p className="text-sm">{mistake}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Select an exercise to view detailed form guidance
              </p>
            )}
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