import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

// Lazy load components
const FileExplorer = lazy(() => import("@/components/document/FileExplorer"));
const DocumentViewer = lazy(() => import("@/components/document/DocumentViewer"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

interface DocumentStatus {
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  approvedBy?: string;
  updatedAt: string;
}

export default function DocManagement() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: documentStatus } = useQuery({
    queryKey: ['/api/documents/workflow', selectedDoc],
    enabled: !!selectedDoc,
  });

  return (
    <div className="grid grid-cols-[30%_70%] gap-6">
      <Card className="h-[calc(100vh-24rem)] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="file-lines" className="h-5 w-5 mr-2" />
              DocExplore
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <FontAwesomeIcon icon="folder-plus" className="h-4 w-4" />
              </Button>
              <Button size="icon">
                <FontAwesomeIcon icon="upload" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSpinner />}>
            <FileExplorer onSelectDocument={setSelectedDoc} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FontAwesomeIcon icon="file-lines" className="h-5 w-5 mr-2" />
              Document Viewer
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={!selectedDoc}
              >
                <FontAwesomeIcon icon="edit" className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!selectedDoc}
              >
                <FontAwesomeIcon icon="download" className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDoc ? (
            <Suspense fallback={<LoadingSpinner />}>
              <DocumentViewer documentId={selectedDoc} isEditing={isEditing} />
            </Suspense>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Select a document from DocExplore to view or edit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}