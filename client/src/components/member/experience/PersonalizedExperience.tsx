import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDumbbell,
  faCarrot,
  faBrain,
  faArrowLeft,
  faPlus,
  faTrophy,
  faHeartPulse,
  faFlag
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HealthMetrics } from "./HealthMetrics";
import { AICoach } from "./AICoach";
import { NutritionPlanGenerator } from "./NutritionPlanGenerator";
import { MilestoneTracker } from "./MilestoneTracker";
import { WorkoutRecommendationEngine } from "./WorkoutRecommendationEngine";
import { AchievementBadges } from "./AchievementBadges";
import { MemberSearch } from "../MemberSearch";
import { HealthGoalWizard } from "./HealthGoalWizard";
import { GoalCenter } from "./GoalCenter";
import { useToast } from "@/hooks/use-toast";

// Define the Member interface based on our Azure Blob Storage schema
interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: string;
  membershipStatus: 'active' | 'inactive' | 'pending' | 'cancelled';
  joinDate: string;
  lastVisit: string;
  totalVisits: number;
  aiInsightCount: number;
  metrics: {
    attendanceRate: number;
    engagementScore: number;
    lifetimeValue: number;
    health: {
      weight: number[];
      bodyFat: number[];
      heartRate: number[];
      bloodPressure: {
        systolic: number[];
        diastolic: number[];
      };
      measurements: {
        chest: number[];
        waist: number[];
        hips: number[];
        biceps: number[];
        thighs: number[];
      };
      dates: string[];
      goals: any[]; // Added goals array
    };
    workouts: Array<{
      type: string;
      date: string;
      duration: number;
      intensity: number;
      exercises: Array<{
        name: string;
        sets: number;
        reps: number;
        weight: number;
      }>;
    }>;
    nutrition: {
      plans: Array<{
        date: string;
        meals: Array<{
          type: string;
          foods: Array<{
            name: string;
            portion: string;
            calories: number;
          }>;
        }>;
      }>;
      preferences: string[];
      restrictions: string[];
    };
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      earnedDate: string;
      type: string;
    }>;
    milestones: Array<{
      id: string;
      name: string;
      target: number;
      current: number;
      unit: string;
      deadline: string;
    }>;
  };
}

export function PersonalizedExperience() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showGoalWizard, setShowGoalWizard] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Save member data mutation
  const saveMemberData = useMutation({
    mutationFn: async (updates: Partial<Member>) => {
      const response = await fetch(`/api/members/${selectedMember?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to save member data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/members/${selectedMember?.id}`] });
      toast({
        title: "Success",
        description: "Goal saved successfully",
      });
    },
  });

  // Handle real-time data updates
  const handleDataUpdate = async (updates: Partial<Member>) => {
    if (!selectedMember) return;
    try {
      await saveMemberData.mutateAsync(updates);
    } catch (error) {
      console.error('Error saving member data:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  // Handle goal wizard save
  const handleGoalSave = async (goal: any) => {
    if (!selectedMember) return;

    const updatedMember = {
      ...selectedMember,
      metrics: {
        ...selectedMember.metrics,
        health: {
          ...selectedMember.metrics.health,
          goals: [...(selectedMember.metrics.health.goals || []), goal],
        },
      },
    };

    try {
      await handleDataUpdate(updatedMember);
      setShowGoalWizard(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  // Handle going back to search
  const handleBackToSearch = () => {
    setSelectedMember(null);
  };

  // Process goals for GoalCenter
  const processGoals = () => {
    if (!selectedMember?.metrics?.health?.goals) return { currentGoals: [], pastGoals: [] };

    const now = new Date();
    const goals = selectedMember.metrics.health.goals.map(goal => ({
      ...goal,
      status: new Date(goal.endDate) < now
        ? "completed"
        : new Date(goal.startDate) > now
          ? "upcoming"
          : "in_progress",
      progress: calculateProgress(goal)
    }));

    return {
      currentGoals: goals.filter(g => g.status !== "completed"),
      pastGoals: goals.filter(g => g.status === "completed")
    };
  };

  const calculateProgress = (goal: any) => {
    const now = new Date();
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Personalized Experience</h2>
          <p className="text-muted-foreground">
            AI-powered workout plans, nutrition recommendations, and personalized coaching
          </p>
        </div>
        {selectedMember && (
          <Button onClick={() => setShowGoalWizard(true)} className="gap-2">
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            Set New Goal
          </Button>
        )}
      </div>

      {!selectedMember ? (
        <MemberSearch onSelect={setSelectedMember} />
      ) : (
        <div className="space-y-6">
          {/* Back to Search Button */}
          <Button
            variant="ghost"
            onClick={handleBackToSearch}
            className="mb-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
            Back to Member Search
          </Button>

          {/* Member Card with Tabs */}
          <Card>
            <CardContent className="pt-6">
              {/* Member Info Section */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge>{selectedMember.membershipType}</Badge>
                  <Badge variant={
                    selectedMember.membershipStatus === 'active' ? 'default' :
                    selectedMember.membershipStatus === 'pending' ? 'secondary' :
                    selectedMember.membershipStatus === 'inactive' ? 'secondary' :
                    'destructive'
                  }>
                    {selectedMember.membershipStatus}
                  </Badge>
                </div>
              </div>

              {/* Member Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-sm">
                  <span className="text-muted-foreground">Member since:</span>
                  <br />
                  {new Date(selectedMember.joinDate).toLocaleDateString()}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Last visit:</span>
                  <br />
                  {new Date(selectedMember.lastVisit).toLocaleDateString()}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total visits:</span>
                  <br />
                  {selectedMember.totalVisits}
                </div>
              </div>

              {/* Tab Navigation */}
              <Tabs defaultValue="goals" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="goals" className="gap-2">
                    <FontAwesomeIcon icon={faTrophy} className="h-4 w-4" />
                    Goal Center
                  </TabsTrigger>
                  <TabsTrigger value="health" className="gap-2">
                    <FontAwesomeIcon icon={faHeartPulse} className="h-4 w-4" />
                    Health Metrics
                  </TabsTrigger>
                  <TabsTrigger value="achievements" className="gap-2">
                    <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
                    Wellness Achievements
                  </TabsTrigger>
                  <TabsTrigger value="milestones" className="gap-2">
                    <FontAwesomeIcon icon={faFlag} className="h-4 w-4" />
                    Fitness Milestones
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="goals">
                  <GoalCenter {...processGoals()} memberId={selectedMember.id} />
                </TabsContent>

                <TabsContent value="health">
                  <HealthMetrics
                    memberId={selectedMember.id}
                    memberData={selectedMember.metrics.health}
                    onDataUpdate={handleDataUpdate}
                  />
                </TabsContent>

                <TabsContent value="achievements">
                  <AchievementBadges
                    memberId={selectedMember.id}
                    achievements={selectedMember.metrics.achievements}
                    onDataUpdate={handleDataUpdate}
                  />
                </TabsContent>

                <TabsContent value="milestones">
                  <MilestoneTracker
                    memberId={selectedMember.id}
                    milestones={selectedMember.metrics.milestones}
                    onDataUpdate={handleDataUpdate}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Health Goal Wizard Dialog */}
          <Dialog open={showGoalWizard} onOpenChange={setShowGoalWizard}>
            <DialogContent className="max-w-2xl">
              <HealthGoalWizard
                memberId={selectedMember.id}
                currentHealth={selectedMember.metrics.health}
                onSave={handleGoalSave}
                onClose={() => setShowGoalWizard(false)}
              />
            </DialogContent>
          </Dialog>

          {/* AI Features Card */}
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
                  <WorkoutRecommendationEngine
                    memberId={selectedMember.id}
                    workoutData={selectedMember.metrics.workouts}
                    onDataUpdate={handleDataUpdate}
                  />
                </TabsContent>

                <TabsContent value="coach">
                  <AICoach
                    memberId={selectedMember.id}
                    memberMetrics={selectedMember.metrics}
                    onDataUpdate={handleDataUpdate}
                  />
                </TabsContent>

                <TabsContent value="nutrition">
                  <NutritionPlanGenerator
                    memberId={selectedMember.id}
                    nutritionData={selectedMember.metrics.nutrition}
                    onDataUpdate={handleDataUpdate}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}