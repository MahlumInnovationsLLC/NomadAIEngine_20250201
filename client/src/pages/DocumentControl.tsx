import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, GraduationCap, Shield } from "lucide-react";
import SearchInterface from "@/components/document/SearchInterface";
import { FileExplorer } from "@/components/document/FileExplorer";
import WorkflowTemplateManager from "@/components/document/WorkflowTemplateManager";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  title: string;
  version: string;
}

interface TrainingModule {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate: string;
}

interface UserRole {
  name: string;
  description: string;
  level: number;
}

interface UserTraining {
  modules: TrainingModule[];
}

export default function DocumentControl() {
  const { toast } = useToast();

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const { data: userTraining } = useQuery<UserTraining>({
    queryKey: ['/api/training/current'],
  });

  const { data: userRole } = useQuery<UserRole>({
    queryKey: ['/api/roles/current'],
  });

  const generateSampleDocuments = async () => {
    try {
      const response = await fetch('/api/documents/generate-samples', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate sample documents');
      }

      toast({
        title: "Success",
        description: "Sample documents have been generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sample documents",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Document Training & Control</h1>
        <Button onClick={generateSampleDocuments}>
          Generate Sample Documents
        </Button>
      </div>

      <div className="mb-8">
        <SearchInterface />
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Templates</TabsTrigger>
          <TabsTrigger value="training">Training Module</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Document Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileExplorer />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowTemplateManager />
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Role Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userRole ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Current Role</p>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                          {userRole.name}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {userRole.description}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No role assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Current Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userTraining?.modules ? (
                  <TrainingProgress modules={userTraining.modules} />
                ) : (
                  <p className="text-muted-foreground">No training modules assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}