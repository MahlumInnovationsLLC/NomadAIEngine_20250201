import { useState } from "react";
import { Tree, TreeNode } from "@/components/ui/tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FolderNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: FolderNode[];
}

export function FolderStructure() {
  const [selectedFolder, setSelectedFolder] = useState<string>('/');
  const [newFolderName, setNewFolderName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: structure, isLoading } = useQuery<FolderNode[]>({
    queryKey: ['/api/documents/structure'],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/structure'] });
      toast({
        title: "Folder created",
        description: "The folder has been created successfully",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName) return;
    const path = `${selectedFolder}/${newFolderName}`.replace(/\/+/g, '/');
    createFolderMutation.mutate(path);
    setNewFolderName('');
  };

  const renderNode = (node: FolderNode) => (
    <TreeNode
      key={node.path}
      id={node.path}
      label={node.name}
      icon={node.type === 'folder' ? 
        <FontAwesomeIcon icon="folder" className="h-4 w-4" /> : 
        <FontAwesomeIcon icon="file" className="h-4 w-4" />
      }
    >
      {node.children?.map(renderNode)}
    </TreeNode>
  );

  if (isLoading) {
    return <div>Loading folder structure...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Document Structure</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FontAwesomeIcon icon="folder-plus" className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Folder</label>
                <Input value={selectedFolder} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder Name</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                />
              </div>
              <Button onClick={handleCreateFolder} className="w-full">
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tree onNodeSelect={(node) => setSelectedFolder(node.toString())}>
        {structure?.map(renderNode)}
      </Tree>
    </div>
  );
}