import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { useQuery } from "@tanstack/react-query";

interface TrainingModule {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate: string;
}

export default function DocManage() {
  const [, navigate] = useLocation();
  const { data: trainingModules } = useQuery<TrainingModule[]>({
    queryKey: ['/api/training/modules'],
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="py-6 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
          <div className="px-4">
            <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
            <p className="text-muted-foreground">
              Manage your documents and track training progress in one centralized platform
            </p>
            <Tabs defaultValue="documents" className="mt-6">
              <TabsList>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 px-4">
          <TabsContent value="documents">
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="file-lines" className="h-5 w-5" />
                  Document Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Access and manage your documents with our advanced document control system. 
                  Upload, edit, and organize your files efficiently.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/documentcontrol")}
                >
                  Go to Document Management
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6 group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="folder-tree" className="h-5 w-5" />
                  Document Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Browse and explore your document repository. Search, filter, and access 
                  documents quickly and efficiently.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/documentexplorer")}
                >
                  Go to Document Explorer
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="graduation-cap" className="h-5 w-5" />
                  Training Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Track your training progress, complete modules, and earn certifications.
                  Stay up-to-date with your learning journey.
                </p>
                {trainingModules ? (
                  <div className="mb-6">
                    <TrainingProgress modules={trainingModules} />
                  </div>
                ) : (
                  <p className="text-muted-foreground mb-6">Loading training modules...</p>
                )}
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/training")}
                >
                  View All Training Modules
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6 group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon="certificate" className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  View and manage your earned certifications. Track your learning achievements
                  and professional development.
                </p>
                <Button 
                  className="w-full flex items-center justify-between"
                  onClick={() => navigate("/docmanage/certifications")}
                >
                  View Certifications
                  <FontAwesomeIcon icon="chevron-right" className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </AnimateTransition>
  );
}