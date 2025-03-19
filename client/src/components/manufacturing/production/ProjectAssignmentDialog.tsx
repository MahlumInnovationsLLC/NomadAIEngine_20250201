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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, CheckSquare, XSquare, Filter } from "lucide-react";
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
  productionLine,
}: ProjectAssignmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>(productionLine.assignedProjects || []);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    enabled: open,
  });

  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedProjects(productionLine.assignedProjects || []);
    }
  }, [open, productionLine]);

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === "" || 
      project.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group projects by status for better organization
  const getProjectsByStatus = () => {
    const groupedProjects: Record<string, Project[]> = {};
    
    filteredProjects.forEach(project => {
      const status = project.status || 'UNKNOWN';
      if (!groupedProjects[status]) {
        groupedProjects[status] = [];
      }
      groupedProjects[status].push(project);
    });
    
    return groupedProjects;
  };

  // Organize projects by status
  const projectsByStatus = getProjectsByStatus();
  const statuses = Object.keys(projectsByStatus).sort();

  // Get unique status values for filter options
  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status))).filter(Boolean);

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  // Mutation to update production line with assigned projects
  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedProjects: selectedProjects
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update assigned projects");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: `Projects assigned to ${productionLine.teamName || productionLine.name} successfully`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign projects",
        variant: "destructive",
      });
    },
  });

  // Handle saving the assignments
  const handleSave = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Assign Projects to {productionLine.teamName || productionLine.name}
          </DialogTitle>
          <DialogDescription>
            Select projects to assign to this production team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status || ''}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label>{filteredProjects.length} projects found</Label>
                <Badge variant="outline">
                  {selectedProjects.length} selected
                </Badge>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-2">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No projects match your search criteria
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statuses.map(status => (
                      <div key={status} className="space-y-2">
                        <div className="sticky top-0 bg-background z-10 py-1">
                          <Badge variant="outline" className="font-semibold">
                            {status} ({projectsByStatus[status].length})
                          </Badge>
                        </div>
                        <div className="space-y-1 pl-1">
                          {projectsByStatus[status].map(project => (
                            <div 
                              key={project.id} 
                              className={`flex items-center rounded-md p-2 hover:bg-muted ${
                                selectedProjects.includes(project.id) ? 'bg-muted/50' : ''
                              }`}
                            >
                              <Checkbox
                                id={`project-${project.id}`}
                                checked={selectedProjects.includes(project.id)}
                                onCheckedChange={() => toggleProjectSelection(project.id)}
                              />
                              <Label
                                htmlFor={`project-${project.id}`}
                                className="flex-grow ml-2 cursor-pointer"
                              >
                                <div className="font-medium">
                                  {project.projectNumber || project.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {project.location || 'No location'} • Due: {
                                    project.delivery ? 
                                    new Date(project.delivery).toLocaleDateString() : 
                                    'Not set'
                                  }
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-2" />
                Save Assignments
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}