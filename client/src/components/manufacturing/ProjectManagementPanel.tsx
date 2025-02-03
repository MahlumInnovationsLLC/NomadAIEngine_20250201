import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Gantt } from "@dhtmlx/trial-gantt-react";
import "@dhtmlx/gantt/codebase/dhtmlxgantt.css";

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  tasks: ProjectTask[];
}

interface ProjectTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: string[];
  assignee: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export function ProjectManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ganttConfig, setGanttConfig] = useState({
    data: { tasks: [], links: [] },
    scales: [
      { unit: "day", step: 1, format: "%d %M" }
    ]
  });

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const response = await fetch(`/api/manufacturing/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error('Failed to update project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedProject) {
      const ganttTasks = selectedProject.tasks.map(task => ({
        id: task.id,
        text: task.name,
        start_date: new Date(task.startDate),
        end_date: new Date(task.endDate),
        progress: task.progress / 100,
        assignee: task.assignee,
        status: task.status,
      }));

      const ganttLinks = selectedProject.tasks
        .filter(task => task.dependencies?.length > 0)
        .flatMap(task => 
          task.dependencies.map(depId => ({
            id: `${depId}-${task.id}`,
            source: depId,
            target: task.id,
            type: "0"
          }))
        );

      setGanttConfig({
        ...ganttConfig,
        data: { tasks: ganttTasks, links: ganttLinks }
      });
    }
  }, [selectedProject]);

  const handleGanttTaskUpdate = async (taskId: string, updates: any) => {
    if (!selectedProject) return;

    const updatedTasks = selectedProject.tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            startDate: updates.start_date.toISOString(),
            endDate: updates.end_date.toISOString(),
            progress: Math.round(updates.progress * 100),
          }
        : task
    );

    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks,
      progress: Math.round(
        updatedTasks.reduce((acc, task) => acc + task.progress, 0) / updatedTasks.length
      )
    };

    updateProjectMutation.mutate(updatedProject);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">
            Manage and track manufacturing projects
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Project List */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon="folder" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                placeholder="Search projects..."
                className="mb-4"
              />
              <div className="space-y-2">
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    variant={selectedProject?.id === project.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedProject(project)}
                  >
                    <FontAwesomeIcon 
                      icon={project.status === 'completed' ? 'check-circle' : 'circle-dot'} 
                      className="mr-2 h-4 w-4"
                    />
                    {project.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details and Gantt Chart */}
        <Card className="col-span-9">
          <CardHeader>
            <CardTitle>
              {selectedProject ? selectedProject.name : "Select a Project"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProject ? (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Number</label>
                    <p>{selectedProject.projectNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <p>{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <p>{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <p className="capitalize">{selectedProject.status.replace('_', ' ')}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Timeline</h3>
                  <div className="h-[400px] border rounded-lg">
                    <Gantt
                      tasks={ganttConfig.data.tasks}
                      links={ganttConfig.data.links}
                      scales={ganttConfig.scales}
                      onTaskUpdated={(id, task) => handleGanttTaskUpdate(id, task)}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Select a project from the list to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}