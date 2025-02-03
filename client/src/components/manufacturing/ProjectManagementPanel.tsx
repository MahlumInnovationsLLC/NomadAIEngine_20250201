import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResourceManagementPanel } from "./ResourceManagementPanel";
import { ProjectCreateDialog } from "./ProjectCreateDialog";
import { Project, ProjectStatus } from "@/types/manufacturing";
import { faArrowUp, faArrowDown, faFolder, faCheckCircle, faCircleDot, faEdit } from "@fortawesome/free-solid-svg-icons";

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function getDaysColor(days: number) {
  if (days <= 3) {
    return "text-green-500";
  } else if (days <= 7) {
    return "text-yellow-500";
  } else {
    return "text-red-500";
  }
}

function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case "NOT STARTED":
      return "bg-gray-500";
    case "IN FAB":
      return "bg-blue-500";
    case "IN ASSEMBLY":
      return "bg-indigo-500";
    case "IN WRAP":
      return "bg-purple-500";
    case "IN NTC TESTING":
      return "bg-orange-500";
    case "IN QC":
      return "bg-yellow-500";
    case "COMPLETED":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

function calculateProjectStatus(project: Project): ProjectStatus {
  if (project.manualStatus) {
    return project.status;
  }

  const today = new Date();
  const dates = {
    fabricationStart: project.fabricationStart ? new Date(project.fabricationStart) : null,
    assemblyStart: project.assemblyStart ? new Date(project.assemblyStart) : null,
    wrapGraphics: project.wrapGraphics ? new Date(project.wrapGraphics) : null,
    ntcTesting: project.ntcTesting ? new Date(project.ntcTesting) : null,
    qcStart: project.qcStart ? new Date(project.qcStart) : null,
    ship: project.ship ? new Date(project.ship) : null,
  };

  // Check if project is completed
  if (dates.ship && today > dates.ship) {
    return "COMPLETED";
  }

  // Find the current status based on where today falls between milestone dates
  if (dates.qcStart && today >= dates.qcStart) {
    return "IN QC";
  }

  if (dates.ntcTesting && today >= dates.ntcTesting) {
    return "IN NTC TESTING";
  }

  if (dates.wrapGraphics && today >= dates.wrapGraphics) {
    return "IN WRAP";
  }

  if (dates.assemblyStart && today >= dates.assemblyStart) {
    return "IN ASSEMBLY";
  }

  if (dates.fabricationStart && today >= dates.fabricationStart) {
    return "IN FAB";
  }

  // If we have future dates set but haven't reached them yet
  if (dates.fabricationStart || dates.assemblyStart || dates.wrapGraphics || 
      dates.ntcTesting || dates.qcStart || dates.ship) {
    return "NOT STARTED";
  }

  return "NOT STARTED";
}

export function ProjectManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"qcStart" | "ship" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const [activeView, setActiveView] = useState<"list" | "map" | "table">("list");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (selectedProject) {
      const updatedProject = projects.find(p => p.id === selectedProject.id);
      if (updatedProject && JSON.stringify(updatedProject) !== JSON.stringify(selectedProject)) {
        setSelectedProject(updatedProject);
      }
    }
  }, [projects, selectedProject]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { id: string; status: ProjectStatus; manualStatus: boolean }) => {
      const response = await fetch(`/api/manufacturing/projects/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update project status');
      return response.json();
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return [updatedProject];
        return oldData.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p);
      });
      toast({
        title: "Success",
        description: "Project status updated successfully"
      });
      setShowStatusDialog(false);
      setPendingStatus(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project status",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (status: ProjectStatus) => {
    if (!selectedProject) return;

    if (status === "COMPLETED" && (!selectedProject.ship || new Date() <= new Date(selectedProject.ship))) {
      toast({
        title: "Invalid Status",
        description: "Project can only be marked as completed after the ship date",
        variant: "destructive"
      });
      return;
    }

    setPendingStatus(status);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = () => {
    if (!selectedProject || !pendingStatus) return;

    updateProjectMutation.mutate({
      id: selectedProject.id,
      status: pendingStatus,
      manualStatus: true
    });
  };

  const handleSort = (field: "qcStart" | "ship") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => (
      (project.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (project.projectNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ))
    .sort((a, b) => {
      if (!sortField) return 0;

      const aDate = a[sortField] ? new Date(a[sortField]).getTime() : 0;
      const bDate = b[sortField] ? new Date(b[sortField]).getTime() : 0;

      return sortDirection === "asc"
        ? aDate - bDate
        : bDate - aDate;
    });

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
            <FontAwesomeIcon icon={faFolder} className="mr-2" />
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
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFolder} />
                      Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Input
                        placeholder="Search projects..."
                        className="mb-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSort("qcStart")}
                        >
                          QC Date
                          {sortField === "qcStart" && (
                            <FontAwesomeIcon
                              icon={sortDirection === "asc" ? faArrowUp : faArrowDown}
                              className="ml-2 h-4 w-4"
                            />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSort("ship")}
                        >
                          Ship Date
                          {sortField === "ship" && (
                            <FontAwesomeIcon
                              icon={sortDirection === "asc" ? faArrowUp : faArrowDown}
                              className="ml-2 h-4 w-4"
                            />
                          )}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {filteredAndSortedProjects.map((project) => (
                          <Button
                            key={project.id}
                            variant={selectedProject?.id === project.id ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSelectedProject(project)}
                          >
                            <FontAwesomeIcon
                              icon={project.status === 'COMPLETED' ? faCheckCircle : faCircleDot}
                              className="mr-2 h-4 w-4"
                            />
                            <div className="flex flex-col items-start flex-grow">
                              <span>{project.projectNumber}</span>
                              {project.name && (
                                <span className="text-xs text-muted-foreground">
                                  {project.name}
                                </span>
                              )}
                              <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                                <span>QC: {formatDate(project.qcStart)}</span>
                                <span>Ship: {formatDate(project.ship)}</span>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-9">
                  <CardHeader>
                    <CardTitle>
                      {selectedProject ? (
                        <div className="flex justify-between items-center">
                          <span>{selectedProject.projectNumber}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                              <FontAwesomeIcon icon={faEdit} className="mr-2" />
                              Edit
                            </Button>

                            <div className="flex gap-2">
                              <Select
                                value={selectedProject?.status}
                                onValueChange={(value: ProjectStatus) => handleStatusChange(value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue>
                                    <div className={`px-3 py-1 rounded-full text-white font-semibold text-lg ${getStatusColor(selectedProject?.status || "NOT STARTED")}`}>
                                      {selectedProject?.status.replace('_', ' ')}
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NOT STARTED">NOT STARTED</SelectItem>
                                  <SelectItem value="IN FAB">IN FAB</SelectItem>
                                  <SelectItem value="IN ASSEMBLY">IN ASSEMBLY</SelectItem>
                                  <SelectItem value="IN WRAP">IN WRAP</SelectItem>
                                  <SelectItem value="IN NTC TESTING">IN NTC TESTING</SelectItem>
                                  <SelectItem value="IN QC">IN QC</SelectItem>
                                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

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
                                  <span>NTC Days:</span>
                                  <span className={getDaysColor(
                                    selectedProject.ntcTesting && selectedProject.qcStart
                                      ? calculateWorkingDays(selectedProject.ntcTesting, selectedProject.qcStart)
                                      : 0
                                  )}>
                                    {selectedProject.ntcTesting && selectedProject.qcStart
                                      ? calculateWorkingDays(selectedProject.ntcTesting, selectedProject.qcStart)
                                      : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>QC Days:</span>
                                  <span className={getDaysColor(parseInt(selectedProject.qcDays || "0"))}>
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

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Manually changing the status will prevent automatic updates based on dates.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowStatusDialog(false);
              setPendingStatus(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedProject && showEditDialog && (
        <ProjectCreateDialog
          project={selectedProject}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
}