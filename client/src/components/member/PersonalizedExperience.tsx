import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemberSearch } from "./MemberSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faHeart,
  faDumbbell,
  faUtensils,
  faBrain,
} from "@fortawesome/free-solid-svg-icons";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: string;
  membershipStatus: string;
  joinDate: string;
  lastVisit: string;
  totalVisits: number;
  aiInsightCount: number;
}

interface PersonalizedData {
  healthMetrics?: {
    steps: number;
    heartRate: number;
    sleep: number;
    calories: number;
  };
  preferences?: {
    workoutPreferences: {
      preferredTime: string;
      focusAreas: string[];
      equipment: string[];
    };
    nutritionPreferences: {
      dietaryRestrictions: string[];
      mealPreferences: string[];
    };
  };
  aiInsights?: {
    recommendations: string[];
    trends: string[];
    risks: string[];
  };
}

export function PersonalizedExperience() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { data: personalizedData, isLoading } = useQuery<PersonalizedData>({
    queryKey: ['/api/members', selectedMember?.id, 'data'],
    enabled: !!selectedMember,
  });

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
  };

  return (
    <div className="space-y-6">
      <MemberSearch onSelect={handleMemberSelect} />

      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle>
              Health Metrics Dashboard for {selectedMember.firstName} {selectedMember.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="health">
              <TabsList className="mb-4">
                <TabsTrigger value="health">
                  <FontAwesomeIcon icon={faHeart} className="mr-2" />
                  Health Metrics
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <FontAwesomeIcon icon={faDumbbell} className="mr-2" />
                  Preferences
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <FontAwesomeIcon icon={faBrain} className="mr-2" />
                  AI Insights
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <TabsContent value="health" className="space-y-4">
                    {personalizedData?.healthMetrics && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                          icon={faHeart}
                          label="Heart Rate"
                          value={`${personalizedData.healthMetrics.heartRate} bpm`}
                        />
                        <MetricCard
                          icon={faChartLine}
                          label="Steps"
                          value={personalizedData.healthMetrics.steps.toLocaleString()}
                        />
                        <MetricCard
                          icon={faBrain}
                          label="Sleep"
                          value={`${personalizedData.healthMetrics.sleep} hours`}
                        />
                        <MetricCard
                          icon={faUtensils}
                          label="Calories"
                          value={personalizedData.healthMetrics.calories.toLocaleString()}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="preferences">
                    {personalizedData?.preferences && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PreferenceSection
                          title="Workout Preferences"
                          data={personalizedData.preferences.workoutPreferences}
                        />
                        <PreferenceSection
                          title="Nutrition Preferences"
                          data={personalizedData.preferences.nutritionPreferences}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="insights">
                    {personalizedData?.aiInsights && (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          <InsightSection
                            title="Recommendations"
                            insights={personalizedData.aiInsights.recommendations}
                          />
                          <InsightSection
                            title="Trends"
                            insights={personalizedData.aiInsights.trends}
                          />
                          <InsightSection
                            title="Risk Assessments"
                            insights={personalizedData.aiInsights.risks}
                          />
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <FontAwesomeIcon icon={icon} className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferenceSection({ title, data }: { title: string; data: Record<string, any> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-sm text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span className="font-medium">
              {Array.isArray(value) ? value.join(', ') : value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightSection({ title, insights }: { title: string; insights: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start gap-2">
            <FontAwesomeIcon icon={faBrain} className="h-4 w-4 text-primary mt-1" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}