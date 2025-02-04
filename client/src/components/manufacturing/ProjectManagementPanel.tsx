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
import {
  faArrowUp,
  faArrowDown,
  faFolder,
  faCheckCircle,
  faCircleDot,
  faEdit,
  faLocationDot,
  faRotateLeft,
  faFileImport
} from "@fortawesome/free-solid-svg-icons";
import { ProductionTimeline } from './ProductionTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


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

function calculateQCDays(project: Project): number {
  if (!project.qcStart) return 0;

  const endDate = project.executiveReview || project.ship;
  if (!endDate) return 0;

  return calculateWorkingDays(project.qcStart, endDate);
}

function calculateProjectStatus(project: Project): ProjectStatus {
  console.log('Calculating status for project:', project);

  if (project.manualStatus) {
    console.log('Using manual status:', project.status);
    return project.status;
  }

  const today = new Date();
  console.log('Current date:', today);

  const dates = {
    fabricationStart: project.fabricationStart ? new Date(project.fabricationStart) : null,
    assemblyStart: project.assemblyStart ? new Date(project.assemblyStart) : null,
    wrapGraphics: project.wrapGraphics ? new Date(project.wrapGraphics) : null,
    ntcTesting: project.ntcTesting ? new Date(project.ntcTesting) : null,
    qcStart: project.qcStart ? new Date(project.qcStart) : null,
    ship: project.ship ? new Date(project.ship) : null,
  };

  console.log('Project dates:', dates);

  if (dates.ship && today >= dates.ship) {
    console.log('Project is COMPLETED');
    return "COMPLETED";
  }

  if (dates.qcStart && today >= dates.qcStart) {
    console.log('Project is IN QC');
    return "IN QC";
  }

  if (dates.ntcTesting && today >= dates.ntcTesting) {
    console.log('Project is IN NTC TESTING');
    return "IN NTC TESTING";
  }

  if (dates.wrapGraphics && today >= dates.wrapGraphics) {
    console.log('Project is IN WRAP');
    return "IN WRAP";
  }

  if (dates.assemblyStart && today >= dates.assemblyStart) {
    console.log('Project is IN ASSEMBLY');
    return "IN ASSEMBLY";
  }

  if (dates.fabricationStart && today >= dates.fabricationStart) {
    console.log('Project is IN FAB');
    return "IN FAB";
  }

  console.log('Project is NOT STARTED');
  return "NOT STARTED";
}

export function ProjectManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"location" | "qcStart" | "ship" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const [activeView, setActiveView] = useState<"list" | "map" | "table">("list");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      return data.map((project: Project) => ({
        ...project,
        status: calculateProjectStatus(project)
      }));
    },
    staleTime: 0,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (selectedProject) {
      const updatedProject = projects.find(p => p.id === selectedProject.id);
      if (updatedProject) {
        const calculatedStatus = calculateProjectStatus(updatedProject);
        console.log('Updated project status:', calculatedStatus);
        setSelectedProject({
          ...updatedProject,
          status: calculatedStatus
        });
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

  const resetStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/manufacturing/projects/${id}/reset-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to reset project status');
      return response.json();
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return [updatedProject];
        return oldData.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p);
      });
      toast({
        title: "Success",
        description: "Project status reset to automatic updates"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset project status",
        variant: "destructive"
      });
    }
  });

  const handleResetStatus = (projectId: string) => {
    resetStatusMutation.mutate(projectId);
  };

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

  const handleSort = (field: "location" | "qcStart" | "ship") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/manufacturing/projects/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const result = await response.json();
      setPreviewData(result.projects);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview projects",
        variant: "destructive"
      });
      setImportFile(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await fetch('/api/manufacturing/projects/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Successfully imported ${result.count} projects`
      });

      // Refresh projects list
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      setShowImportDialog(false);
      setImportFile(null);
      setPreviewData([]);
      setShowPreview(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import projects",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => (
      (project.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (project.projectNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ))
    .sort((a, b) => {
      if (!sortField) return 0;

      if (sortField === "location") {
        const aLocation = (a.location || '').toLowerCase();
        const bLocation = (b.location || '').toLowerCase();
        return sortDirection === "asc"
          ? aLocation.localeCompare(bLocation)
          : bLocation.localeCompare(aLocation);
      }

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="gap-2"
          >
            <FontAwesomeIcon icon={faFileImport} className="h-4 w-4" />
            Import Excel
          </Button>
          <ProjectCreateDialog />
        </div>
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Projects from Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Excel File
              </label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={showPreview}
              />
            </div>
            {showPreview && previewData.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-medium">Preview (First 3 Projects)</div>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Project Number</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Location</th>
                        <th className="p-2 text-left">Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 3).map((project, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="p-2">{project.projectNumber}</td>
                          <td className="p-2">{project.name || '-'}</td>
                          <td className="p-2">{project.location || '-'}</td>
                          <td className="p-2">{project.team || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-sm text-muted-foreground">
                  {previewData.length > 3 && (
                    <p>...and {previewData.length - 3} more projects</p>
                  )}
                </div>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Note: Excel columns should match project fields:
              projectNumber, name, location, team, etc.
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                  setPreviewData([]);
                  setShowPreview(false);
                }}
              >
                Cancel
              </Button>
              {showPreview ? (
                <Button
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? "Importing..." : `Import ${previewData.length} Projects`}
                </Button>
              ) : (
                <Button disabled>
                  Select a file to preview
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


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
                          onClick={() => handleSort("location")}
                        >
                          Location
                          <FontAwesomeIcon
                            icon={sortField === "location" ? (sortDirection === "asc" ? faArrowUp : faArrowDown) : faArrowDown}
                            className={`ml-2 h-4 w-4 ${sortField === "location" ? 'opacity-100' : 'opacity-40'}`}
                          />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSort("qcStart")}
                        >
                          QC Date
                          <FontAwesomeIcon
                            icon={sortField === "qcStart" ? (sortDirection === "asc" ? faArrowUp : faArrowDown) : faArrowDown}
                            className={`ml-2 h-4 w-4 ${sortField === "qcStart" ? 'opacity-100' : 'opacity-40'}`}
                          />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSort("ship")}
                        >
                          Ship Date
                          <FontAwesomeIcon
                            icon={sortField === "ship" ? (sortDirection === "asc" ? faArrowUp : faArrowDown) : faArrowDown}
                            className={`ml-2 h-4 w-4 ${sortField === "ship" ? 'opacity-100' : 'opacity-40'}`}
                          />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {filteredAndSortedProjects.map((project) => (
                          <Button
                            key={project.id}
                            variant={selectedProject?.id === project.id ? "default" : "ghost"}
                            className="w-full justify-start py-4 px-4 h-auto space-y-2"
                            onClick={() => setSelectedProject(project)}
                          >
                            <div className="flex w-full">
                              <FontAwesomeIcon
                                icon={project.status === 'COMPLETED' ? faCheckCircle : faCircleDot}
                                className="mr-2 h-4 w-4 mt-1 flex-shrink-0"
                              />
                              <div className="flex flex-col items-start flex-grow space-y-2 min-w-0">
                                <span className="font-medium text-sm">{project.projectNumber}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                  <span>{project.location || 'N/A'}</span>
                                </div>
                                {project.name && (
                                  <span className="text-xs text-muted-foreground truncate w-full">
                                    {project.name}
                                  </span>
                                )}
                                <div className="flex justify-between w-full text-xs text-muted-foreground pt-1">
                                  <span>QC: {formatDate(project.qcStart)}</span>
                                  <span>Ship: {formatDate(project.ship)}</span>
                                </div>
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
                                value={selectedProject?.status || "NOT STARTED"}
                                onValueChange={(value: ProjectStatus) => handleStatusChange(value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue>
                                    <div className={`px-3 py-1 rounded-full text-white font-semibold text-lg ${getStatusColor(selectedProject?.status || "NOT STARTED")}`}>
                                      {selectedProject?.status || "NOT STARTED"}
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
                            {selectedProject?.manualStatus && (
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-red-500 text-sm font-medium">
                                  WARNING: Force Edited
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => handleResetStatus(selectedProject.id)}
                                >
                                  <FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-3 w-3" />
                                  Reset to Automatic
                                </Button>
                              </div>
                            )}
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

                        <div className="mx-auto max-w-[95%]">
                          <ProductionTimeline project={selectedProject} />
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
                                  <span className={getDaysColor(calculateQCDays(selectedProject))}>
                                    {calculateQCDays(selectedProject) || '-'}
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
              Manually changing thestatus will prevent automatic updates based on dates.
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