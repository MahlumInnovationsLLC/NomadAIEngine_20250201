import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faCarrot, faBrain, faChartLine, faPersonRunning, faUserPlus, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
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

  // Handle going back to search
  const handleBackToSearch = () => {
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Personalized Experience</h2>
        <p className="text-muted-foreground">
          AI-powered workout plans, nutrition recommendations, and personalized coaching
        </p>
      </div>

      {!selectedMember ? (
        /* Member Search Section - Only shown when no member is selected */
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

          {/* Selected Member Card */}
          <Card className="bg-accent/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
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
                    selectedMember.membershipStatus === 'pending' ? 'warning' :
                    selectedMember.membershipStatus === 'inactive' ? 'secondary' :
                    'destructive'
                  }>
                    {selectedMember.membershipStatus}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
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
      )}
    </div>
  );
}