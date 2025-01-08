import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, File, Upload, FolderPlus, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface BlobItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
}

interface FileExplorerProps {
  onSelectDocument?: (id: number) => void;
}

export function FileExplorer({ onSelectDocument }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<BlobItem[]>({
    queryKey: ['/api/documents/browse', currentPath],
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files[]', file);
      });
      formData.append('folder', currentPath);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/browse'] });
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${selectedFiles.length} files`,
      });
      setSelectedFiles([]);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const response = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${currentPath}/${folderName}`.replace(/\/+/g, '/') }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/browse'] });
      setShowNewFolderDialog(false);
      setNewFolderName('');
      toast({
        title: "Folder created",
        description: "The folder has been created successfully",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  const navigateToFolder = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  const handleSelectDocument = async (path: string) => {
    if (onSelectDocument) {
      try {
        const response = await fetch(`/api/documents?path=${encodeURIComponent(path)}`);
        if (response.ok) {
          const document = await response.json();
          if (document && document.id) {
            onSelectDocument(document.id);
          }
        }
      } catch (error) {
        console.error("Error fetching document details:", error);
      }
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={navigateUp} disabled={currentPath === '/'}>
              ..
            </Button>
            <span className="text-sm font-medium">{currentPath}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                  <Button onClick={handleCreateFolder} className="w-full">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/documents/browse'] })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="border rounded-md h-[400px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <span>Loading...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Folder className="h-8 w-8 mb-2" />
              <p>This folder is empty</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.path}
                  className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => item.type === 'folder' ? navigateToFolder(item.path) : handleSelectDocument(item.path)}
                >
                  {item.type === 'folder' ? (
                    <Folder className="h-4 w-4 mr-2" />
                  ) : (
                    <File className="h-4 w-4 mr-2" />
                  )}
                  <span className="flex-1">{item.name}</span>
                  {item.type === 'file' && (
                    <span className="text-sm text-muted-foreground">
                      {(item.size || 0) / 1024 > 1024
                        ? `${((item.size || 0) / 1024 / 1024).toFixed(2)} MB`
                        : `${((item.size || 0) / 1024).toFixed(2)} KB`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="mt-4">
          <div className="border-2 border-dashed rounded-md p-4">
            <Input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="mb-2"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} files selected`
                  : 'No files selected'}
              </span>
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}