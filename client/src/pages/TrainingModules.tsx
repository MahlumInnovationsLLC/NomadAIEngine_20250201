import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useLocation } from "wouter";

interface Module {
  id: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  totalSections: number;
  completedSections: number;
}

export default function TrainingModules() {
  const [, setLocation] = useLocation();

  const { data: modules, isLoading } = useQuery<Module[]>({
    queryKey: ['/api/training/modules'],
  });

  const getStatusColor = (status: Module['status']) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
    }
  };

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Training Progress</h1>
          <p className="text-muted-foreground mb-4">
            Track your learning journey and achievements
          </p>
        </div>

        <div className="px-4 py-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Learning Modules</CardTitle>
                <Button onClick={() => setLocation('/docmanage/training/create')}>
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Create Module
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : modules?.length ? (
                  <div className="grid gap-4">
                    {modules.map((module) => (
                      <Card key={module.id} className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setLocation(`/docmanage/training/module/${module.id}`)}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{module.title}</h3>
                            <Badge className={getStatusColor(module.status)}>
                              {module.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-4">{module.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress: {module.progress}%</span>
                            <span>{module.completedSections} of {module.totalSections} sections completed</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${module.progress}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon="book" className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No learning modules available.</p>
                    <p className="text-muted-foreground">Create a new module to get started.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimateTransition>
  );
}
