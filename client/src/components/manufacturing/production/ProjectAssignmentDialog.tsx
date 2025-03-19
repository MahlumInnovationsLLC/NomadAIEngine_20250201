import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types/manufacturing";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface ProjectAssignmentDialogProps {
  lineId: string;
  lineName: string;
  onClose: () => void;
}

export function ProjectAssignmentDialog({ lineId, lineName, onClose }: ProjectAssignmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  // Fetch all projects
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch current production line assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<string[]>({
    queryKey: [`/api/manufacturing/production-lines/${lineId}/assignments`],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing/production-lines/${lineId}/assignments`);
      if (!response.ok) throw new Error('Failed to fetch production line assignments');
      return response.json();
    }
  });

  // Initialize selected projects with current assignments
  useEffect(() => {
    if (assignments.length > 0) {
      setSelectedProjects(assignments);
    }
  }, [assignments]);

  // Mutation for updating project assignments
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (projectIds: string[]) => {
      const response = await fetch(`/api/manufacturing/production-lines/${lineId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectIds }),
      });
      
      if (!response.ok) throw new Error('Failed to update project assignments');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manufacturing/production-lines/${lineId}/assignments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Projects Assigned Successfully",
        description: `Assigned projects to ${lineName}`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign projects",
        variant: "destructive",
      });
    }
  });

  // Handle checkbox change
  const handleCheckboxChange = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  // Handle save button
  const handleSave = () => {
    updateAssignmentsMutation.mutate(selectedProjects);
  };

  // Filter projects that are not completed
  const activeProjects = projects.filter(project => project.status !== 'COMPLETED');

  // Loading state
  if (projectsLoading || assignmentsLoading) {
    return (
      <div className="py-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  // Error state
  if (projectsError) {
    return (
      <div className="py-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">Failed to load projects</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select projects to assign to the <span className="font-semibold">{lineName}</span> production line.
      </p>
      
      {activeProjects.length === 0 ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-4" />
          <p>No active projects available for assignment</p>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto pr-2">
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <div key={project.id} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                <Checkbox 
                  id={`project-${project.id}`} 
                  checked={selectedProjects.includes(project.id)}
                  onCheckedChange={() => handleCheckboxChange(project.id)}
                />
                <label 
                  htmlFor={`project-${project.id}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  <div className="font-medium">{project.projectNumber}</div>
                  <div className="text-muted-foreground text-xs">
                    Status: {project.status} | Ship: {new Date(project.ship || '').toLocaleDateString()}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={updateAssignmentsMutation.isPending}
        >
          {updateAssignmentsMutation.isPending ? 'Saving...' : 'Save Assignments'}
        </Button>
      </div>
    </div>
  );
}