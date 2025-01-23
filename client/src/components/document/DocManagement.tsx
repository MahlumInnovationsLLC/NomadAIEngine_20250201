import { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { DocumentViewer } from "./DocumentViewer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, UserCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Reviewer {
  id: string;
  name: string;
}

export function DocManagement() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock reviewers data - in production this would come from an API
  const reviewers: Reviewer[] = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Mike Johnson" },
  ];

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("Uploading files...");
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.text();
        console.error("Upload error:", error);
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/browse', currentPath] });
      toast({
        title: "Upload successful",
        description: "Files have been uploaded successfully",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const assignReviewerMutation = useMutation({
    mutationFn: async ({ documentId, reviewerId }: { documentId: string, reviewerId: string }) => {
      console.log("Assigning reviewer...", { documentId, reviewerId });
      const response = await fetch('/api/documents/assign-reviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, reviewerId }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.text();
        console.error("Assign reviewer error:", error);
        throw new Error('Failed to assign reviewer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', selectedDocument] });
      toast({
        title: "Reviewer assigned",
        description: "Document has been assigned for review",
      });
    },
    onError: (error) => {
      console.error("Assign reviewer error:", error);
      toast({
        title: "Assignment failed",
        description: "Failed to assign reviewer",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('path', currentPath);

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    console.log("Uploading files to path:", currentPath);
    uploadMutation.mutate(formData);
  };

  const handlePathChange = (path: string) => {
    console.log("Path changed to:", path);
    setCurrentPath(path);
    setSelectedDocument(null);
    setIsEditing(false);
  };

  const handleDocumentSelect = (path: string) => {
    console.log("Selected document:", path);
    setSelectedDocument(path);
    setIsEditing(false);
  };

  const handleAssignReviewer = (reviewerId: string) => {
    if (selectedDocument) {
      console.log("Assigning reviewer:", { reviewerId, document: selectedDocument });
      assignReviewerMutation.mutate({ documentId: selectedDocument, reviewerId });
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden p-4">
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Column - File Explorer */}
        <div className="flex flex-col h-full max-h-full overflow-hidden border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <FileExplorer 
              onSelectDocument={handleDocumentSelect}
              onPathChange={handlePathChange}
            />
          </div>
        </div>

        {/* Right Column - Document Viewer */}
        <div className="flex flex-col h-full max-h-full overflow-hidden border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {selectedDocument ? selectedDocument.split('/').pop() : "Document Viewer"}
            </h2>
            {selectedDocument && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "View Mode" : "Edit Mode"}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedDocument ? (
              <DocumentViewer
                documentId={selectedDocument}
                isEditing={isEditing}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a document to view or edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocManagement;