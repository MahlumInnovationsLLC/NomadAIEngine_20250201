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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductionLine, Project } from "../../../types/manufacturing";

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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    enabled: open,
  });

  // Fetch assigned projects for this production line
  const { data: assignedProjects = [], isLoading: isLoadingAssignments } = useQuery<string[]>({
    queryKey: ['/api/manufacturing/production-lines', productionLine.id, 'assignments'],
    enabled: open,
    initialData: productionLine.assignedProjects || [],
    // If the endpoint doesn't exist yet, just use the productionLine.assignedProjects
  });

  // Initialize selectedProjects with current assignments when dialog opens
  useEffect(() => {
    if (open && assignedProjects) {
      setSelectedProjects(assignedProjects);
    }
  }, [open, assignedProjects]);

  // Update production line assignments
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (projectIds: string[]) => {
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedProjects: projectIds,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update assignments");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: "Project assignments updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project assignments",
        variant: "destructive",
      });
    },
  });

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      project.projectNumber.toLowerCase().includes(searchLower) ||
      (project.name && project.name.toLowerCase().includes(searchLower)) ||
      (project.location && project.location.toLowerCase().includes(searchLower)) ||
      (project.team && project.team.toLowerCase().includes(searchLower))
    );
  });

  // Group projects by status
  const planningProjects = filteredProjects.filter(p => p.status === "NOT_STARTED" || p.status === "PLANNING");
  const activeProjects = filteredProjects.filter(p => 
    p.status !== "NOT_STARTED" && 
    p.status !== "PLANNING" && 
    p.status !== "COMPLETED"
  );
  const completedProjects = filteredProjects.filter(p => p.status === "COMPLETED");

  // Handle save button click
  const handleSave = () => {
    updateAssignmentsMutation.mutate(selectedProjects);
  };

  // Render project card with selection toggle
  const renderProjectCard = (project: Project) => {
    const isSelected = selectedProjects.includes(project.id);
    
    return (
      <Card 
        key={project.id} 
        className={`mb-2 cursor-pointer ${isSelected ? 'border-primary/50 bg-primary/5' : ''}`}
        onClick={() => toggleProjectSelection(project.id)}
      >
        <CardContent className="p-3 flex justify-between items-center">
          <div>
            <h4 className="font-medium text-sm">{project.projectNumber}</h4>
            <p className="text-muted-foreground text-xs">{project.name || "No name"}</p>
            <div className="flex gap-2 mt-1">
              {project.location && (
                <Badge variant="outline" className="text-xs">
                  {project.location}
                </Badge>
              )}
              {project.team && (
                <Badge variant="outline" className="text-xs">
                  {project.team}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <Badge variant={isSelected ? "default" : "outline"} className="ml-2">
              {isSelected ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : null}
              {isSelected ? "Selected" : "Select"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Projects to Production Line</DialogTitle>
          <DialogDescription>
            Select projects to assign to {productionLine.name}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by number, name, location, or team..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoadingProjects || isLoadingAssignments ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? "No projects match your search" : "No projects available"}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="active" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">
                  Active ({activeProjects.length})
                </TabsTrigger>
                <TabsTrigger value="planning">
                  Planning ({planningProjects.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedProjects.length})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden mt-4">
                <TabsContent value="active" className="h-full">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {activeProjects.map(renderProjectCard)}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="planning" className="h-full">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {planningProjects.map(renderProjectCard)}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="completed" className="h-full">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {completedProjects.map(renderProjectCard)}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        <div className="mt-2 pt-2 border-t flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Selected projects:</span>{" "}
            <span className="font-medium">{selectedProjects.length}</span>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateAssignmentsMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={updateAssignmentsMutation.isPending}
            >
              {updateAssignmentsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Assignments
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}