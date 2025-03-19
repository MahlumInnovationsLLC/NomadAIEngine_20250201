import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductionLine, Project } from "@/types/manufacturing";

interface ProjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLine: ProductionLine;
}

export function ProjectAssignmentDialog({
  open,
  onOpenChange,
  productionLine
}: ProjectAssignmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    productionLine.assignedProjects || []
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset selected projects when the dialog opens with a new production line
  useEffect(() => {
    if (open) {
      setSelectedProjects(productionLine.assignedProjects || []);
    }
  }, [open, productionLine]);

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    enabled: open,
  });

  // Update production line with assigned projects
  const updateAssignmentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectIds: selectedProjects }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project assignments');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: 'Success',
        description: 'Project assignments updated successfully',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project assignments',
        variant: 'destructive',
      });
    },
  });

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle checkbox change
  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  // Handle save
  const handleSave = () => {
    updateAssignmentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Projects to {productionLine.name}</DialogTitle>
          <DialogDescription>
            Select projects to assign to this production line
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          {isLoadingProjects ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No projects found matching your search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Checkbox 
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={(checked) => 
                      handleProjectSelection(project.id, checked === true)
                    }
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`project-${project.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {project.projectNumber}
                      {project.name && ` - ${project.name}`}
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{project.status}</Badge>
                      {project.location && (
                        <Badge variant="outline" className="bg-blue-500/10">
                          {project.location}
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-green-500/10">
                        Progress: {project.progress}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter className="mt-4 pt-4 border-t">
          <div className="mr-auto flex items-center text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 mr-1" />
            {selectedProjects.length} project(s) selected
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateAssignmentMutation.isPending}
          >
            {updateAssignmentMutation.isPending ? 'Saving...' : 'Save Assignments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}