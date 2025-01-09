import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, File, FolderPlus, RefreshCw } from "lucide-react";
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
  const [currentPath, setCurrentPath] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<BlobItem[]>({
    queryKey: ['/api/documents/browse', currentPath],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      const response = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath }),
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

  const handleCreateFolder = () => {
    if (newFolderName) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  const navigateToFolder = (folderPath: string) => {
    // Remove the trailing slash if present for consistent navigation
    const cleanPath = folderPath.endsWith('/') ? folderPath.slice(0, -1) : folderPath;
    console.log("Navigating to folder:", cleanPath);
    setCurrentPath(cleanPath);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const segments = currentPath.split('/');
    segments.pop(); // Remove the last segment
    const parentPath = segments.join('/');
    console.log("Navigating up to:", parentPath);
    setCurrentPath(parentPath);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={navigateUp} disabled={!currentPath}>
              ..
            </Button>
            <span className="text-sm font-medium">{currentPath || '/'}</span>
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
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="w-full px-3 py-2 border rounded-md"
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
        <div className="border rounded-md h-[500px] overflow-y-auto p-2">
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
                  onClick={() => item.type === 'folder' ? navigateToFolder(item.path) : null}
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
      </CardContent>
    </Card>
  );
}