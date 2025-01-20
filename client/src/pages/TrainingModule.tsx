import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Book, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

interface TrainingModule {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate: string;
}

interface UserTraining {
  modules: TrainingModule[];
}

export default function TrainingModule() {
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const { data: userTraining } = useQuery<UserTraining>({
    queryKey: ['/api/training/current'],
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Training Progress</h1>
          <p className="text-muted-foreground mb-4">
            Track your learning progress and complete training modules
          </p>
        </div>

        <div className="px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Training Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userTraining?.modules ? (
                  userTraining.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {module.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Book className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium">{module.title}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Due: {new Date(module.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{module.status}</span>
                        <span>{module.progress}% complete</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No training modules assigned yet.
                    </p>
                    <Button variant="outline" className="mt-4">
                      Request Training
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Available Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {userTraining?.modules ? (
                  userTraining.modules.map((module) => (
                    <div
                      key={module.id}
                      className="mb-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setActiveModule(module.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{module.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          module.status === 'completed' ? 'bg-green-100 text-green-700' :
                          module.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {module.status}
                        </span>
                      </div>
                      <Progress value={module.progress} className="h-1 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(module.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No modules available at the moment.
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimateTransition>
  );
}