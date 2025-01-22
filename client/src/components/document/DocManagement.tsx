import { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { DocumentViewer } from "./DocumentViewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Eye, 
  Pen
} from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Documents</h2>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <Upload className="h-4 w-4 mr-2" />
                Upload
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
        <FileExplorer 
          onSelectDocument={handleDocumentSelect}
          onPathChange={handlePathChange}
        />
      </div>

      {selectedDocument && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium truncate">
              {selectedDocument.split('/').pop()}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View Mode
                </>
              ) : (
                <>
                  <Pen className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              )}
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