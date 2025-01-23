import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  FolderPlus, 
  ArrowUp,
  RefreshCw,
  Folder,
  File,
  Loader2
} from "lucide-react";

interface BlobItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
}

interface FileExplorerProps {
  onSelectDocument?: (path: string) => void;
  onPathChange?: (path: string) => void;
}

export function FileExplorer({ onSelectDocument, onPathChange }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, refetch } = useQuery<BlobItem[]>({
    queryKey: ['/api/documents/browse', currentPath],
    queryFn: async () => {
      console.log("Fetching documents for path:", currentPath);
      try {
        const params = new URLSearchParams();
        if (currentPath) params.set('path', currentPath);
        const response = await fetch(`/api/documents/browse?${params.toString()}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching documents:", errorText);
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        console.log("Fetched documents:", data);
        return data;
      } catch (error) {
        console.error("Error in document fetch:", error);
        throw error;
      }
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const response = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath ? `${currentPath}${folderName}` : folderName }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/browse', currentPath] });
      setShowNewFolderDialog(false);
      setNewFolderName('');
      toast({
        title: "Folder created",
        description: "The folder has been created successfully",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName) return;
    createFolderMutation.mutate(newFolderName);
  };

  const navigateToFolder = (folderPath: string) => {
    const cleanPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    console.log("Navigating to folder:", cleanPath);
    setCurrentPath(cleanPath);
    onPathChange?.(cleanPath);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const segments = currentPath.split('/').filter(Boolean);
    segments.pop();
    const parentPath = segments.length > 0 ? `${segments.join('/')}/` : "";
    console.log("Navigating up to:", parentPath);
    setCurrentPath(parentPath);
    onPathChange?.(parentPath);
  };

  const handleItemClick = (item: BlobItem) => {
    console.log("Clicked item:", item);
    if (item.type === 'folder') {
      navigateToFolder(item.path);
    } else if (onSelectDocument) {
      const fullPath = currentPath ? `${currentPath}${item.name}` : item.name;
      console.log("Selected document with full path:", fullPath);
      onSelectDocument(fullPath);
    }
  };

  const refreshCurrentFolder = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents/browse', currentPath] });
    refetch();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={navigateUp} disabled={!currentPath}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate max-w-[200px]">
            {currentPath || '/'}
          </span>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshCurrentFolder}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Folder className="h-8 w-8 mb-2" />
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {items.map((item) => (
              <div
                key={item.path}
                className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                {item.type === 'folder' ? (
                  <Folder className="h-4 w-4 mr-2" />
                ) : (
                  <File className="h-4 w-4 mr-2" />
                )}
                <span className="flex-1 truncate">{item.name}</span>
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
    </div>
  );
}

export default FileExplorer;