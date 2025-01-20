
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
import { AdminModuleManager } from "@/components/training/AdminModuleManager";

// Example training data for development
const exampleTrainingData = {
  currentLevel: 3,
  currentExp: 750,
  nextLevelExp: 1000,
  modules: [
    {
      id: "1",
      title: "Document Management Fundamentals",
      description: "Learn the basics of document management and organization",
      completedLessons: 3,
      totalLessons: 5,
      requiredLevel: 1
    },
    {
      id: "2",
      title: "Advanced Document Processing",
      description: "Master advanced techniques in document processing and analysis",
      completedLessons: 1,
      totalLessons: 4,
      requiredLevel: 2
    },
    {
      id: "3",
      title: "Workflow Automation",
      description: "Automate document workflows and improve efficiency",
      completedLessons: 0,
      totalLessons: 3,
      requiredLevel: 3
    }
  ],
  recentActivity: [
    {
      id: "a1",
      description: "Completed Lesson: Introduction to Document Types",
      timestamp: new Date().toISOString(),
      type: "completion"
    },
    {
      id: "a2",
      description: "Passed Quiz: Document Classification",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: "quiz"
    },
    {
      id: "a3",
      description: "Started Lesson: Advanced Search Techniques",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      type: "lesson"
    }
  ],
  achievements: [
    {
      id: "ach1",
      name: "Document Master",
      description: "Complete all fundamental training modules",
      unlockedAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: "ach2",
      name: "Workflow Wizard",
      description: "Successfully automate 5 document workflows",
      unlockedAt: new Date(Date.now() - 345600000).toISOString()
    },
    {
      id: "ach3",
      name: "Search Expert",
      description: "Master advanced document search techniques",
      unlockedAt: undefined
    }
  ]
};

export default function TrainingModule() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'achievements' | 'create' | 'assessment'>('overview');
  const [isCreating, setIsCreating] = useState(false);

  const { data: trainingData } = useQuery({
    queryKey: ['/api/training/progress'],
    initialData: exampleTrainingData
  });

  // If this component is rendered as a child of DocManage, skip the header
  if (window.location.pathname.includes('/docmanage/training')) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <TrainingProgress modules={trainingData?.modules || []} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleModuleComplete = () => {
    setSelectedModuleId(null);
    setActiveTab('modules');
  };

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
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage your documents, configure training modules, and control document workflows.
        </p>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => window.location.href = '/docmanage/docmanagement'}
              className="px-6 py-2 text-sm font-medium border bg-background hover:bg-secondary border-r-0 rounded-l-lg focus:z-10 focus:outline-none"
            >
              DocManagement
            </button>
            <button
              onClick={() => window.location.href = '/docmanage/training'}
              className="px-6 py-2 text-sm font-medium border bg-primary text-primary-foreground border-primary rounded-r-lg focus:z-10 focus:outline-none"
            >
              Training Module
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Training Progress
                </CardTitle>
                <AdminModuleManager />
              </div>
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
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-6">
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

              <TabsContent value="assessment">
                <SkillAssessment />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
