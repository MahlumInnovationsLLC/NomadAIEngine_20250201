import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faCarrot, faBrain, faChartLine, faPersonRunning, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HealthMetrics } from "./HealthMetrics";
import { AICoach } from "./AICoach";
import { NutritionPlanGenerator } from "./NutritionPlanGenerator";
import { MilestoneTracker } from "./MilestoneTracker";
import { WorkoutRecommendationEngine } from "./WorkoutRecommendationEngine";
import { AchievementBadges } from "./AchievementBadges";
import { MemberSearch } from "../MemberSearch";

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
  const queryClient = useQueryClient();

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
    },
  });

  // Handle real-time data updates
  const handleDataUpdate = async (updates: Partial<Member>) => {
    if (!selectedMember) return;
    try {
      await saveMemberData.mutateAsync(updates);
    } catch (error) {
      console.error('Error saving member data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Personalized Experience</h2>
        <p className="text-muted-foreground">
          AI-powered workout plans, nutrition recommendations, and personalized coaching
        </p>
      </div>

      {/* Member Search Section */}
      <MemberSearch onSelect={setSelectedMember} />

      {selectedMember ? (
        <div className="space-y-6">
          {/* Selected Member Header */}
          <Card className="bg-accent/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
                <Badge>{selectedMember.membershipType}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Health Metrics - Full Width */}
          <HealthMetrics 
            memberId={selectedMember.id} 
            memberData={selectedMember.metrics.health}
            onDataUpdate={handleDataUpdate}
          />

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

          {/* Achievement Badges */}
          <AchievementBadges 
            memberId={selectedMember.id}
            achievements={selectedMember.metrics.achievements}
            onDataUpdate={handleDataUpdate}
          />

          {/* Milestone Tracker - Full Width */}
          <MilestoneTracker 
            memberId={selectedMember.id}
            milestones={selectedMember.metrics.milestones}
            onDataUpdate={handleDataUpdate}
          />
        </div>
      ) : (
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FontAwesomeIcon icon={faUserPlus} className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Member Selected</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2">
                Please select a member using the search above to view and manage their personalized experience data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}