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
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage your documents, configure training modules, and control document workflows.
        </p>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => window.location.href = '/docmanage/docmanagement'}
              className={`px-6 py-2 text-sm font-medium border ${
                location.pathname.includes('docmanagement')
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-secondary"
              } rounded-l-lg focus:z-10 focus:outline-none`}
            >
              DocManagement
            </button>
            <button
              onClick={() => window.location.href = '/docmanage/training'}
              className={`px-6 py-2 text-sm font-medium border-t border-b border-r ${
                location.pathname.includes('training')
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-secondary"
              } rounded-r-lg focus:z-10 focus:outline-none`}
            >
              Training Module
            </button>
          </div>
        </div>
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
                  <FontAwesomeIcon icon="file-lines" className="mr-2 h-5 w-5" />
                  Document Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileExplorer onSelectDocument={(id) => setSelectedDocumentId(id)} />
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
      </Tabs>
    </div>
  );
}