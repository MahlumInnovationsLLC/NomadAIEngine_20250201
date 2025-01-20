import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderPlus, Upload, Download, Edit, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

// Lazy load heavy components
const FileExplorer = lazy(() => import("@/components/document/FileExplorer"));
const DocumentViewer = lazy(() => import("@/components/document/DocumentViewer").then(mod => ({ default: mod.DocumentViewer })));
const WorkflowDialog = lazy(() => import("@/components/document/WorkflowDialog").then(mod => ({ default: mod.WorkflowDialog })));
const DocumentPermissions = lazy(() => import("@/components/document/DocumentPermissions").then(mod => ({ default: mod.DocumentPermissions })));
const SearchInterface = lazy(() => import("@/components/document/SearchInterface"));
const TrainingModule = lazy(() => import("./TrainingModule"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

interface DocumentStatus {
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  approvedBy?: string;
  updatedAt: string;
}

export function DocManage() {
  const [selectedDocumentPath, setSelectedDocumentPath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();

  const { data: documentStatus } = useQuery<DocumentStatus>({
    queryKey: ['/api/documents/workflow', selectedDocumentPath],
    enabled: !!selectedDocumentPath,
  });

  return (
    <div className="container mx-auto">
      <div className="text-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-4">
          <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
          <p className="text-muted-foreground mb-4">
            Manage your documents, configure training modules, and control document workflows.
          </p>
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button
                variant="outline"
                onClick={() => setLocation("/docmanage/docmanagement")}
              >
                DocManagement
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/docmanage/training")}
              >
                Training Module
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDocumentPath ? (
              <DocumentViewer documentId={selectedDocumentPath} isEditing={isEditing} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No documents found. Please upload a document first.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}