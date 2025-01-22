import { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { DocumentViewer } from "./DocumentViewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FontAwesomeIcon icon="upload" className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Label htmlFor="files">Select files to upload</Label>
                <input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <FileExplorer 
          onSelectDocument={setSelectedDocument} 
          onPathChange={handlePathChange}
        />
      </div>

      {selectedDocument && (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <FontAwesomeIcon 
                icon={isEditing ? "eye" : "pen"} 
                className="h-4 w-4 mr-2" 
              />
              {isEditing ? "View Mode" : "Edit Mode"}
            </Button>
          </div>
          <DocumentViewer
            documentId={selectedDocument}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
}

export default DocManagement;