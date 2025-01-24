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
  faWandMagicSparkles,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Smartphone,
  RefreshCcw,
  Link as LinkIcon,
  UnlinkIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { WorkoutGenerationLoader } from "./WorkoutGenerationLoader";

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

interface WearableDeviceData {
  connected: boolean;
  lastSync: string | null;
  provider: 'apple_health' | 'fitbit' | 'garmin' | null;
  workouts: Array<{
    date: string;
    type: string;
    duration: number;
    calories: number;
    heartRate: {
      avg: number;
      max: number;
    };
    distance?: number;
  }>;
}

const fallbackWorkoutPlan: WorkoutPlan = {
  id: "default",
  name: "Default Strength Program",
  type: "Strength Training",
  difficulty: "intermediate",
  duration: "45 minutes",
  caloriesBurn: 350,
  userProgress: 0,
  exercises: [
    {
      id: "e1",
      name: "Bodyweight Squats",
      type: "strength",
      difficulty: "beginner",
      targetMuscles: ["quadriceps", "hamstrings", "glutes"],
      sets: 3,
      reps: 12,
      restPeriod: "60 seconds",
      formGuidance: [
        "Stand with feet shoulder-width apart",
        "Keep your back straight",
        "Lower your body as if sitting back into a chair",
        "Keep your knees aligned with your toes"
      ],
      commonMistakes: [
        "Letting knees cave inward",
        "Rounding the back",
        "Not going deep enough"
      ]
    }
  ]
};

export function WorkoutRecommendationEngine({ memberId, workoutData, onDataUpdate }: WorkoutRecommendationEngineProps) {
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [activeTab, setActiveTab] = useState("current");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Progress simulation effect when generating workout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (generateAIWorkout.isPending && generationStep < 4) {
      timeoutId = setTimeout(() => {
        setGenerationStep(prev => prev + 1);
      }, 1000);
    } else if (!generateAIWorkout.isPending) {
      setGenerationStep(0);
    }
    return () => clearTimeout(timeoutId);
  }, [generateAIWorkout.isPending, generationStep]);

  const generateAIWorkout = useMutation({
    mutationFn: async () => {
      setGenerationStep(0); // Reset step counter
      const response = await fetch(`/api/workout-plans/${memberId}/generate`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate workout plan: ${errorText}`);
      }
      return response.json();
    },
    onMutate: () => {
      toast({
        title: "Generating Workout Plan",
        description: "Please wait while we create your personalized workout plan...",
        duration: 3000,
      });
    },
    onSuccess: (newPlan) => {
      queryClient.setQueryData(['/api/workout-plans', memberId], newPlan);
      toast({
        title: "Workout Plan Generated",
        description: "Your new workout plan is ready!",
        duration: 3000,
      });
      setSelectedPlan(newPlan);
      setActiveTab("current");
    },
    onError: (error) => {
      console.error('Error generating workout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate workout plan",
        duration: 5000,
      });
    }
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-500";
    if (progress >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const syncWearableData = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/wearable-data/${memberId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync wearable data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearable-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plans'] });
    },
  });

  const connectWearableDevice = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/wearable-data/${memberId}/connect`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to connect wearable device');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearable-data'] });
    },
  });

  const { data: wearableData } = useQuery<WearableDeviceData>({
    queryKey: ['/api/wearable-data', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/wearable-data/${memberId}`);
      if (!response.ok) throw new Error('Failed to fetch wearable data');
      return response.json();
    },
  });

  const { data: workoutPlan, isLoading: isLoadingPlan, error: planError } = useQuery({
    queryKey: ['/api/workout-plans', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/workout-plans/${memberId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch workout plan: ${errorText}`);
      }
      return response.json();
    }
  });

  const renderWearableDeviceSection = () => (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium">Wearable Device Integration</h3>
        </div>
        {wearableData?.connected ? (
          <Badge variant="outline" className="gap-1">
            <LinkIcon className="h-3 w-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <UnlinkIcon className="h-3 w-3" />
            Not Connected
          </Badge>
        )}
      </div>

      {wearableData?.connected ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Last synced: {wearableData.lastSync ? new Date(wearableData.lastSync).toLocaleString() : 'Never'}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={() => syncWearableData.mutate()}
            disabled={syncWearableData.isPending}
          >
            <RefreshCcw className={`h-4 w-4 ${syncWearableData.isPending ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          onClick={() => connectWearableDevice.mutate()}
          disabled={connectWearableDevice.isPending}
        >
          <LinkIcon className="h-4 w-4" />
          Connect Apple Health
        </Button>
      )}

      {wearableData?.workouts && wearableData.workouts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Workouts from Device</h4>
          <div className="space-y-2">
            {wearableData.workouts.slice(0, 3).map((workout, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>{workout.type}</span>
                  <span>{new Date(workout.date).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                  <div>Duration: {workout.duration}m</div>
                  <div>Calories: {workout.calories}</div>
                  <div>Avg HR: {workout.heartRate.avg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGenerateWorkoutSection = () => (
    <div className="mb-6 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <h3 className="font-medium flex items-center gap-2">
            <FontAwesomeIcon icon={faBrain} className="text-purple-500" />
            AI Workout Generation
          </h3>
          <p className="text-sm text-muted-foreground">
            Generate a personalized workout based on your goals and metrics
          </p>
        </div>
        <Button
          onClick={() => generateAIWorkout.mutate()}
          disabled={generateAIWorkout.isPending}
          className="gap-2"
        >
          {generateAIWorkout.isPending ? (
            <>
              <FontAwesomeIcon icon={faRotate} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faWandMagicSparkles} />
              Generate Workout
            </>
          )}
        </Button>
      </div>

      {generateAIWorkout.isPending && (
        <WorkoutGenerationLoader currentStep={generationStep} />
      )}

      {generateAIWorkout.isError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {generateAIWorkout.error instanceof Error 
              ? generateAIWorkout.error.message 
              : "Failed to generate workout plan. Please try again."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Show loading state
  if (isLoadingPlan) {
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

  // Get the active plan - either the selected plan, fetched plan, or fallback
  const activePlan = selectedPlan || workoutPlan || fallbackWorkoutPlan;

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faDumbbell} className="h-5 w-5 text-blue-500" />
            AI Workout Engine
          </CardTitle>
          {generateAIWorkout.isPending ? (
            <Badge variant="secondary" className="animate-pulse gap-1">
              <FontAwesomeIcon icon={faBolt} />
              Generating Plan
            </Badge>
          ) : (
            <Badge variant="secondary" className="animate-pulse">
              AI Optimizing
            </Badge>
          )}
        </div>
        {planError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>
              Failed to load workout plan. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {renderGenerateWorkoutSection()}
        {renderWearableDeviceSection()}
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
                  <h3 className="font-semibold text-lg">{activePlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activePlan.type} • {activePlan.duration} • {activePlan.caloriesBurn} kcal
                  </p>
                </div>
                <Badge variant="outline">{activePlan.difficulty}</Badge>
              </div>

              <div className="space-y-4">
                {activePlan.exercises.map((exercise) => (
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
                    <span className={getProgressColor(activePlan.userProgress)}>
                      {activePlan.userProgress}%
                    </span>
                  </div>
                  <Progress value={activePlan.userProgress} />
                </div>
              </div>

              {activePlan.progressData && (
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-medium">Progress Tracking</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activePlan.progressData}>
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
                {activePlan.aiInsights?.map((insight, index) => (
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