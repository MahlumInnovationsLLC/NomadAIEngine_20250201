
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderPlus, Upload, Download, Edit, Send } from "lucide-react";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { WorkflowDialog } from "@/components/document/WorkflowDialog";
import { DocumentPermissions } from "@/components/document/DocumentPermissions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchInterface from "@/components/document/SearchInterface";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TrainingModule from "./TrainingModule";

interface DocumentStatus {
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  approvedBy?: string;
  updatedAt: string;
}

export function DocManage() {
  const [selectedDocumentPath, setSelectedDocumentPath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useLocation();

  const { data: documentStatus } = useQuery<DocumentStatus>({
    queryKey: ['/api/documents/workflow', selectedDocumentPath],
    enabled: !!selectedDocumentPath,
  });

  useEffect(() => {
    setIsEditing(false);
  }, [selectedDocumentPath]);

  const handleDownload = async () => {
    if (!selectedDocumentPath) return;
  };

  return (
    <div className="container mx-auto">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">Document Training & Control</h1>
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setLocation("/docmanage/docmanagement")}
                className={`px-6 py-2 text-sm font-medium border ${
                  location.includes("docmanagement")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-secondary"
                } rounded-l-lg focus:z-10 focus:outline-none`}
              >
                DocManagement
              </button>
              <button
                onClick={() => setLocation("/docmanage/training")}
                className={`px-6 py-2 text-sm font-medium border-t border-b border-r ${
                  location.includes("training")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-secondary"
                } rounded-r-lg focus:z-10 focus:outline-none`}
              >
                Training Module
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        {location.includes("training") ? (
          <TrainingModule />
        ) : (

      <div className="mt-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <SearchInterface />
          </CardContent>
        </Card>

        <div className="grid grid-cols-[300px,1fr] gap-6">
          <Card className="h-[calc(100vh-24rem)] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  DocExplorer
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                  <Button size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="-mx-2">
              <FileExplorer onSelectDocument={(path) => setSelectedDocumentPath(path)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  DocManage
                </div>
                {documentStatus && (
                  <span className={`text-sm px-2 py-1 rounded ${
                    documentStatus.status === 'approved' ? 'bg-green-100 text-green-800' :
                    documentStatus.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                    documentStatus.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {documentStatus.status.toUpperCase()}
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={!selectedDocumentPath}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownload}
                  disabled={!selectedDocumentPath}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {selectedDocumentPath && (
                  <WorkflowDialog
                    documentId={selectedDocumentPath}
                    documentTitle={selectedDocumentPath.split('/').pop() || ''}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!selectedDocumentPath}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send for Review/Approval
                      </Button>
                    }
                  />
                )}
              </div>
              <Separator className="mt-2" />
            </CardHeader>
            <CardContent>
              {selectedDocumentPath ? (
                <Tabs defaultValue="content">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content" className="space-y-4">
                    <DocumentViewer 
                      documentId={selectedDocumentPath} 
                      isEditing={isEditing}
                    />
                  </TabsContent>
                  <TabsContent value="permissions">
                    <DocumentPermissions 
                      documentId={selectedDocumentPath}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Select a document from the explorer to view and manage its details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
