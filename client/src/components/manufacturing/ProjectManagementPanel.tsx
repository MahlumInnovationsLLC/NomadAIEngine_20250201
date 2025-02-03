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
  name?: string;
  location?: string;
  team?: string;
  contractDate?: string;
  dpasRating?: string;
  chassisEta?: string;
  stretchShortenGears?: 'N/A' | 'Stretch' | 'Shorten' | 'Gears';
  paymentMilestones?: string;
  lltsOrdered?: string;
  meAssigned?: string;
  meCadProgress?: number;
  eeAssigned?: string;
  eeDesignProgress?: number;
  itAssigned?: string;
  itDesignProgress?: number;
  ntcAssigned?: string;
  ntcDesignProgress?: number;
  fabricationStart?: string;
  assemblyStart?: string;
  wrapGraphics?: string;
  ntcTesting?: string;
  qcStart?: string;
  qcDays?: string;
  executiveReview?: string;
  ship?: string;
  delivery?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  tasks?: ProjectTask[];
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

function formatDate(dateString?: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

export function ProjectManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "map" | "table">("list");

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
    (project.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (project.projectNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  function getQCDaysColor(days: number) {
      if (days <= 3) {
          return "text-green-500";
      } else if (days <= 7) {
          return "text-yellow-500";
      } else {
          return "text-red-500";
      }
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
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
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
                              <span>{project.projectNumber}</span>
                              {project.name && (
                                <span className="text-xs text-muted-foreground">
                                  {project.name}
                                </span>
                              )}
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
                          <span>{selectedProject.projectNumber}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                              <FontAwesomeIcon icon="edit" className="mr-2" />
                              Edit
                            </Button>
                            <Badge variant={selectedProject.status === 'completed' ? 'default' : 'secondary'}>
                              {selectedProject.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        "Select a Project"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProject ? (
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Project Number</label>
                            <p>{selectedProject.projectNumber}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <p>{selectedProject.location || '-'}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Team</label>
                            <p>{selectedProject.team || '-'}</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Contract Date</label>
                            <p>{formatDate(selectedProject.contractDate) || '-'}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">DPAS Rating</label>
                            <p>{selectedProject.dpasRating || '-'}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Chassis ETA</label>
                            <p>{selectedProject.chassisEta || '-'}</p>
                          </div>
                        </div>

                        {/* Team Progress */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Engineering Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span>ME: {selectedProject.meAssigned}</span>
                                    <span>{selectedProject.meCadProgress}%</span>
                                  </div>
                                  <Progress value={selectedProject.meCadProgress} />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span>EE: {selectedProject.eeAssigned}</span>
                                    <span>{selectedProject.eeDesignProgress}%</span>
                                  </div>
                                  <Progress value={selectedProject.eeDesignProgress} />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span>IT: {selectedProject.itAssigned}</span>
                                    <span>{selectedProject.itDesignProgress}%</span>
                                  </div>
                                  <Progress value={selectedProject.itDesignProgress} />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <span>NTC: {selectedProject.ntcAssigned}</span>
                                    <span>{selectedProject.ntcDesignProgress}%</span>
                                  </div>
                                  <Progress value={selectedProject.ntcDesignProgress} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Fabrication Start:</span>
                                  <span>{formatDate(selectedProject.fabricationStart)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Assembly Start:</span>
                                  <span>{formatDate(selectedProject.assemblyStart)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Wrap/Graphics:</span>
                                  <span>{formatDate(selectedProject.wrapGraphics)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>NTC Testing:</span>
                                  <span>{formatDate(selectedProject.ntcTesting)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>QC Start:</span>
                                  <span>{formatDate(selectedProject.qcStart)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>QC Days:</span>
                                  <span className={getQCDaysColor(parseInt(selectedProject.qcDays || "0"))}>
                                    {selectedProject.qcDays || '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Executive Review:</span>
                                  <span>{selectedProject.executiveReview ? new Date(selectedProject.executiveReview).toLocaleString() : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ship:</span>
                                  <span>{formatDate(selectedProject.ship)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery:</span>
                                  <span>{formatDate(selectedProject.delivery)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Tasks Section */}
                        {selectedProject.tasks && selectedProject.tasks.length > 0 && (
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
                                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
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
                        )}
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

            <TabsContent value="map">
              <div className="text-center p-8 text-muted-foreground">
                Map View coming soon...
              </div>
            </TabsContent>

            <TabsContent value="table">
              <div className="text-center p-8 text-muted-foreground">
                Table View coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="resources">
          <ResourceManagementPanel />
        </TabsContent>
      </Tabs>

      {selectedProject && showEditDialog && (
        <ProjectCreateDialog
          project={selectedProject}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
}