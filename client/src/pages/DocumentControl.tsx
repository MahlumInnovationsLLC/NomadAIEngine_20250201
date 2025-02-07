import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import SearchInterface from "@/components/document/SearchInterface";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocumentConfig } from "@/components/document/DocumentConfig";
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
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
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

  return (
    <div className="container mx-auto">
      <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-4">Document Training & Control</h1>
        <p className="text-muted-foreground mb-8">
          Comprehensive document management and training control system for maintaining organization-wide standards
        </p>
        <Tabs defaultValue="documents" className="w-full max-w-4xl mx-auto">
          <TabsList className="w-full justify-start border-b rounded-none pb-px">
            <TabsTrigger value="documents">Overview</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Templates</TabsTrigger>
            <TabsTrigger value="training">Training Module</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 py-6">
        <div className="mb-8">
          <SearchInterface />
        </div>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon="file-lines" className="mr-2 h-5 w-5" />
                  Document Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileExplorer onSelectDocument={(id) => setSelectedDocumentId(Number(id))} />
              </CardContent>
            </Card>

            {selectedDocumentId && (
              <DocumentConfig documentId={selectedDocumentId} />
            )}
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
                  <FontAwesomeIcon icon="shield" className="mr-2 h-5 w-5" />
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
                  <FontAwesomeIcon icon="graduation-cap" className="mr-2 h-5 w-5" />
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
      </div>
    </div>
  );
}