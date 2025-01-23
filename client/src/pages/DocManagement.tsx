import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocumentViewer } from "@/components/document/DocumentViewer";

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
  const [currentPath, setCurrentPath] = useState("");

  const { data: documentStatus } = useQuery<DocumentStatus>({
    queryKey: ['/api/documents/workflow', selectedDoc],
    enabled: !!selectedDoc,
  });

  const handlePathChange = (path: string) => {
    console.log("Path changed:", path);
    setCurrentPath(path);
    setSelectedDoc(null);
    setIsEditing(false);
  };

  const handleDocumentSelect = (path: string) => {
    console.log("Document selected:", path);
    setSelectedDoc(path);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-[30%_70%] gap-6">
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon="file-lines" className="h-5 w-5 mr-2" />
              DocExplorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileExplorer 
              onSelectDocument={handleDocumentSelect}
              onPathChange={handlePathChange}
            />
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FontAwesomeIcon icon="file-lines" className="h-5 w-5 mr-2" />
                Document Viewer
              </div>
              {selectedDoc && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <FontAwesomeIcon icon="edit" className="h-4 w-4 mr-2" />
                    {isEditing ? "View" : "Edit"}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100vh-12rem)]">
            {selectedDoc ? (
              <DocumentViewer documentId={selectedDoc} isEditing={isEditing} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a document from DocExplorer to view or edit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}