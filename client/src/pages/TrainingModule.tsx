import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Book, CheckCircle, Clock, PlusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ModuleCard } from "@/components/training/ModuleCard";
import { ModuleViewer } from "@/components/training/ModuleViewer";
import { ModuleCreator } from "@/components/training/ModuleCreator";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SkillAssessment } from "@/components/training/SkillAssessment";

// Types from the schema
interface TrainingModule {
  id: string;
  title: string;
  description: string;
  completedLessons: number;
  totalLessons: number;
  requiredLevel: number;
  content: {
    lessons: Array<{
      id: string;
      title: string;
      content: string;
    }>;
    quizzes: Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  };
}

interface Activity {
  id: string;
  description: string;
  timestamp: string;
  type: 'completion' | 'quiz' | 'lesson';
}

interface TrainingData {
  currentLevel: number;
  currentExp: number;
  nextLevelExp: number;
  modules: TrainingModule[];
  recentActivity: Activity[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt?: string;
  }>;
}

export default function TrainingModule() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'achievements' | 'create' | 'assessment'>('overview');
  const [isCreating, setIsCreating] = useState(false);

  const { data: trainingData } = useQuery<TrainingData>({
    queryKey: ['/api/training/progress'],
  });

  const handleModuleComplete = () => {
    setSelectedModuleId(null);
    setActiveTab('modules');
    // queryClient.invalidateQueries({ queryKey: ['/api/training/progress'] });
  };

  // If creating a new module, show the creator interface
  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Module</h2>
          <Button variant="ghost" onClick={() => setIsCreating(false)}>
            Cancel
          </Button>
        </div>
        <ModuleCreator />
      </div>
    );
  }

  // If a module is selected, show the module viewer
  if (selectedModuleId) {
    return (
      <div className="space-y-6">
        <ModuleViewer
          moduleId={selectedModuleId}
          onComplete={handleModuleComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Training Progress
            </CardTitle>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Learning Modules</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="assessment">Skill Assessment</TabsTrigger>
              <TabsTrigger value="create">Create Module</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6">
                {/* Current Level Progress */}
                <div className="bg-card rounded-lg p-6 border">
                  <h3 className="text-lg font-medium mb-2">Current Progress</h3>
                  <div className="flex items-center gap-2 text-2xl font-bold mb-4">
                    <Award className="h-6 w-6 text-primary" />
                    <span>Level {trainingData?.currentLevel ?? 1}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Experience</span>
                      <span>{trainingData?.currentExp ?? 0} / {trainingData?.nextLevelExp ?? 100} XP</span>
                    </div>
                    <Progress
                      value={((trainingData?.currentExp ?? 0) / (trainingData?.nextLevelExp ?? 100)) * 100}
                    />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card rounded-lg p-6 border">
                  <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-3">
                      {trainingData?.recentActivity?.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-2 text-sm">
                          {activity.type === 'completion' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : activity.type === 'quiz' ? (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Book className="h-4 w-4 text-blue-500" />
                          )}
                          <span>{activity.description}</span>
                          <span className="text-muted-foreground ml-auto">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modules">
              <div className="grid gap-6 md:grid-cols-2">
                {trainingData?.modules?.map((module) => (
                  <ModuleCard
                    key={module.id}
                    moduleId={module.id}
                    title={module.title}
                    description={module.description}
                    totalLessons={module.totalLessons}
                    completedLessons={module.completedLessons}
                    isLocked={module.requiredLevel > (trainingData?.currentLevel ?? 1)}
                    requiredLevel={module.requiredLevel}
                    onStart={() => setSelectedModuleId(module.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid gap-4 md:grid-cols-2">
                {trainingData?.achievements?.map((achievement) => (
                  <Card key={achievement.id} className={`${!achievement.unlockedAt && 'opacity-50'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Trophy className={`h-5 w-5 ${
                          achievement.unlockedAt ? 'text-yellow-500' : 'text-gray-400'
                        }`} />
                        <div>
                          <h4 className="font-medium">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          {achievement.unlockedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="create">
              <ModuleCreator />
            </TabsContent>
            <TabsContent value="assessment">
              <SkillAssessment />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}