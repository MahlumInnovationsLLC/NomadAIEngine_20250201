import { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { DocumentViewer } from "./DocumentViewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";

export function DocManagement() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/browse', currentPath] });
      setShowUploadDialog(false);
      toast({
        title: "Upload successful",
        description: "Files have been uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
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

    uploadMutation.mutate(formData);
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
    setSelectedDocument(null);
    setIsEditing(false);
  };

  const handleDocumentSelect = (path: string) => {
    console.log("Selected document:", path);
    setSelectedDocument(path);
    setIsEditing(false);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden p-4">
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Column - File Explorer */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Label htmlFor="files">Select files to upload to {currentPath || '/'}</Label>
                  <input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="w-full border rounded p-2"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-grow overflow-hidden">
            <FileExplorer 
              onSelectDocument={handleDocumentSelect}
              onPathChange={handlePathChange}
            />
          </div>
        </div>

        {/* Right Column - Document Viewer */}
        <div className="flex flex-col h-full">
          {selectedDocument ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium truncate">
                  {selectedDocument.split('/').pop()}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "View Mode" : "Edit Mode"}
                  </Button>
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <DocumentViewer
                  documentId={selectedDocument}
                  isEditing={isEditing}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a document to view or edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocManagement;