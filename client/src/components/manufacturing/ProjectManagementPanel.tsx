import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceManagementPanel } from "./ResourceManagementPanel";
import { ProjectCreateDialog } from "./ProjectCreateDialog";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "resources">("overview");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <ProjectCreateDialog />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="list" className="mr-2" />
            Project Overview
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FontAwesomeIcon icon="users" className="mr-2" />
            Resource Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="space-y-2">
                    {filteredProjects.map((project) => (
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
                        <div className="flex flex-col items-start">
                          <span>{project.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {project.projectNumber}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="col-span-9">
              <CardHeader>
                <CardTitle>
                  {selectedProject ? (
                    <div className="flex justify-between items-center">
                      <span>{selectedProject.name}</span>
                      <Badge variant={selectedProject.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedProject.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ) : (
                    "Select a Project"
                  )}
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
                        <label className="text-sm font-medium">Progress</label>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedProject.progress} className="w-full" />
                          <span className="text-sm">{selectedProject.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Tasks</h3>
                        <Button size="sm" variant="outline">
                          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                          Add Task
                        </Button>
                      </div>

                      <div className="divide-y">
                        {selectedProject.tasks.map((task) => (
                          <div key={task.id} className="py-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{task.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                  {task.assignee}
                                </div>
                                <Progress value={task.progress} className="w-24" />
                                <Badge variant="outline">
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
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
        </TabsContent>

        <TabsContent value="resources">
          <ResourceManagementPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}