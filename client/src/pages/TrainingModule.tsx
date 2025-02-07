import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateModuleDialog } from "@/components/training/CreateModuleDialog";
import { LearningModules } from "@/components/training/LearningModules";
import { Achievements } from "@/components/training/Achievements";
import { SkillAssessment } from "@/components/training/SkillAssessment";

interface TrainingStats {
  totalModules: number;
  activeTrainees: number;
  completionRate: number;
  certificatesIssued: number;
}

interface TrainingModule {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate: string;
}

interface RecentActivity {
  type: 'completion' | 'quiz' | 'start';
  title: string;
  date: string;
}

interface UserTraining {
  modules: TrainingModule[];
  currentLevel: number;
  xp: number;
  maxXp: number;
  recentActivities: RecentActivity[];
}

export default function TrainingModule() {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ['/api/training/stats'],
    refetchInterval: 30000,
  });

  const { data: userTraining } = useQuery<UserTraining>({
    queryKey: ['/api/training/current'],
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Training Progress</h1>
          <p className="text-muted-foreground mb-4">
            Track your learning journey and achievements
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Modules</p>
                    <h3 className="text-2xl font-bold">{stats?.totalModules || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="book" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Trainees</p>
                    <h3 className="text-2xl font-bold">{stats?.activeTrainees || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="users" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <h3 className="text-2xl font-bold">{stats?.completionRate || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Certificates Issued</p>
                    <h3 className="text-2xl font-bold">{stats?.certificatesIssued || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="certificate" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">
                <FontAwesomeIcon icon="home" className="mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="learning">
                <FontAwesomeIcon icon="book" className="mr-2" />
                Learning Modules
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <FontAwesomeIcon icon="trophy" className="mr-2" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="assessment">
                <FontAwesomeIcon icon="clipboard-check" className="mr-2" />
                Skill Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FontAwesomeIcon icon="trophy-star" className="h-5 w-5" />
                      Current Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">Level {userTraining?.currentLevel || 3}</h3>
                          <Progress value={(userTraining?.xp || 750) / (userTraining?.maxXp || 1000) * 100} className="h-2" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userTraining?.xp || 750} / {userTraining?.maxXp || 1000} XP
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FontAwesomeIcon icon="clock" className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-4">
                        {userTraining?.recentActivities ? (
                          userTraining.recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <FontAwesomeIcon
                                icon={
                                  activity.type === 'completion' ? 'circle-check' :
                                    activity.type === 'quiz' ? 'award' : 'circle-plus'
                                }
                                className={`h-4 w-4 ${
                                  activity.type === 'completion' ? 'text-green-500' :
                                    activity.type === 'quiz' ? 'text-yellow-500' : 'text-blue-500'
                                }`}
                              />
                              <div>
                                <p className="font-medium">{activity.title}</p>
                                <p className="text-sm text-muted-foreground">{activity.date}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-4">No recent activity</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FontAwesomeIcon icon="book" className="h-5 w-5" />
                    Current Modules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {userTraining?.modules ? (
                      userTraining.modules.map((module) => (
                        <div
                          key={module.id}
                          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setActiveModule(module.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {module.status === 'completed' ? (
                                <FontAwesomeIcon icon="circle-check" className="h-4 w-4 text-green-500" />
                              ) : (
                                <FontAwesomeIcon icon="book" className="h-4 w-4 text-blue-500" />
                              )}
                              <h3 className="font-medium">{module.title}</h3>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              module.status === 'completed' ? 'bg-green-100 text-green-700' :
                                module.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                            }`}>
                              {module.status.replace('_', ' ')}
                            </span>
                          </div>
                          <Progress value={module.progress} className="h-1 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(module.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          No training modules assigned yet.
                        </p>
                        <Button variant="outline">Request Training</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning">
              <LearningModules />
            </TabsContent>

            <TabsContent value="achievements">
              <Achievements />
            </TabsContent>

            <TabsContent value="assessment">
              <SkillAssessment />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimateTransition>
  );
}