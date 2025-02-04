import { useState, useEffect, useMemo, useCallback } from "react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  faFileImport,
  faTrashCan
} from "@fortawesome/pro-light-svg-icons";
import { ProductionTimeline } from './ProductionTimeline';
import { RichTextEditor } from "@/components/ui/rich-text-editor";

// Move these utility functions outside component to prevent recreation
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  return adjustedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC'
  });
};

const calculateWorkingDays = (startDate: string, endDate: string): number => {
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
};

const getDaysColor = (days: number) => {
  if (days <= 3) return "text-green-500";
  if (days <= 7) return "text-yellow-500";
  return "text-red-500";
};

const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case "NOT STARTED": return "bg-gray-500";
    case "IN FAB": return "bg-blue-500";
    case "IN ASSEMBLY": return "bg-indigo-500";
    case "IN WRAP": return "bg-purple-500";
    case "IN NTC TESTING": return "bg-orange-500";
    case "IN QC": return "bg-yellow-500";
    case "COMPLETED": return "bg-green-500";
    default: return "bg-gray-500";
  }
};

const calculateQCDays = (project: Project): number => {
  if (!project.qcStart) return 0;
  const endDate = project.executiveReview || project.ship;
  if (!endDate) return 0;
  return calculateWorkingDays(project.qcStart, endDate);
};

const calculateProjectStatus = (project: Project): ProjectStatus => {
  if (project.manualStatus) {
    return project.status;
  }

  const today = new Date();
  const dates = {
    ship: project.ship ? new Date(project.ship) : null,
    qcStart: project.qcStart ? new Date(project.qcStart) : null,
    ntcTesting: project.ntcTesting ? new Date(project.ntcTesting) : null,
    wrapGraphics: project.wrapGraphics ? new Date(project.wrapGraphics) : null,
    assemblyStart: project.assemblyStart ? new Date(project.assemblyStart) : null,
    fabricationStart: project.fabricationStart ? new Date(project.fabricationStart) : null,
  };

  if (dates.ship && today >= dates.ship) return "COMPLETED";
  if (dates.qcStart && today >= dates.qcStart) return "IN QC";
  if (dates.ntcTesting && today >= dates.ntcTesting) return "IN NTC TESTING";
  if (dates.wrapGraphics && today >= dates.wrapGraphics) return "IN WRAP";
  if (dates.assemblyStart && today >= dates.assemblyStart) return "IN ASSEMBLY";
  if (dates.fabricationStart && today >= dates.fabricationStart) return "IN FAB";

  return "NOT STARTED";
};

const editProjectSchema = z.object({
  projectNumber: z.string().min(1, "Project number is required"),
  name: z.string().optional(),
  location: z.string().optional(),
  team: z.string().optional(),
  contractDate: z.string().optional(),
  dpasRating: z.string().optional(),
  chassisEta: z.string().optional(),
  fabricationStart: z.string().optional(),
  assemblyStart: z.string().optional(),
  wrapGraphics: z.string().optional(),
  ntcTesting: z.string().optional(),
  qcStart: z.string().optional(),
  executiveReview: z.string().optional(),
  ship: z.string().optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
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
    staleTime: 5000, // Increase stale time to reduce refetches
    refetchInterval: 5000, // Reduce refetch frequency
  });

  // Memoize filtered and sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    return projects
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

        const aDate = a[sortField];
        const bDate = b[sortField];

        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;

        const aTimestamp = new Date(aDate).getTime();
        const bTimestamp = new Date(bDate).getTime();

        return sortDirection === "asc"
          ? aTimestamp - bTimestamp
          : bTimestamp - aTimestamp;
      });
  }, [projects, searchQuery, sortField, sortDirection]);

  // Memoize event handlers
  const handleSort = useCallback((field: "location" | "qcStart" | "ship") => {
    setSortField(current => {
      if (current === field) {
        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        return field;
      }
      setSortDirection("desc");
      return field;
    });
  }, []);

  const handleStatusChange = useCallback((status: ProjectStatus) => {
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
  }, [selectedProject, toast]);

  // Optimize useEffect to reduce unnecessary updates
  useEffect(() => {
    if (!selectedProject) return;

    const updatedProject = projects.find(p => p.id === selectedProject.id);
    if (!updatedProject) return;

    const calculatedStatus = calculateProjectStatus(updatedProject);
    if (selectedProject.status !== calculatedStatus || selectedProject.manualStatus !== updatedProject.manualStatus) {
      setSelectedProject({
        ...updatedProject,
        status: calculatedStatus
      });
    }
  }, [projects, selectedProject?.id, calculateProjectStatus]);

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

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/manufacturing/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(p => p.id !== deletedProjectId);
      });
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      if (selectedProject?.id === deletedProjectId) {
        setSelectedProject(null);
      }
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive"
      });
    }
  });

  const handleResetStatus = (projectId: string) => {
    resetStatusMutation.mutate(projectId);
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

  const handleDeleteClick = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  const handleNotesChange = async (content: string) => {
    try {
      const response = await fetch(`/api/manufacturing/projects/${selectedProject?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: content })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save notes: ${errorData.message || response.statusText}`);
      }

      const updatedProject = await response.json();

      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(p =>
          p.id === selectedProject?.id
            ? { ...p, notes: content }
            : p
        );
      });

      toast({
        title: "Success",
        description: "Notes updated successfully"
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notes",
        variant: "destructive"
      });
    }
  };

  const confirmStatusChange = () => {
    if (!selectedProject || !pendingStatus) return;

    updateProjectMutation.mutate({
      id: selectedProject.id,
      status: pendingStatus,
      manualStatus: true
    });
  };

  const editProjectMutation = useMutation({
    mutationFn: async (data: EditProjectFormValues) => {
      if (!selectedProject) throw new Error('No project selected');

      const response = await fetch(`/api/manufacturing/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      return response.json();
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return [updatedProject];
        return oldData.map(p => p.id === updatedProject.id ? updatedProject : p);
      });
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive"
      });
    }
  });

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      projectNumber: selectedProject?.projectNumber || '',
      name: selectedProject?.name || '',
      location: selectedProject?.location || '',
      team: selectedProject?.team || '',
      contractDate: selectedProject?.contractDate || '',
      dpasRating: selectedProject?.dpasRating || '',
      chassisEta: selectedProject?.chassisEta || '',
      fabricationStart: selectedProject?.fabricationStart || '',
      assemblyStart: selectedProject?.assemblyStart || '',
      wrapGraphics: selectedProject?.wrapGraphics || '',
      ntcTesting: selectedProject?.ntcTesting || '',
      qcStart: selectedProject?.qcStart || '',
      executiveReview: selectedProject?.executiveReview || '',
      ship: selectedProject?.ship || '',
    }
  });

  useEffect(() => {
    if (selectedProject && showEditDialog) {
      form.reset({
        projectNumber: selectedProject.projectNumber || '',
        name: selectedProject.name || '',
        location: selectedProject.location || '',
        team: selectedProject.team || '',
        contractDate: selectedProject.contractDate || '',
        dpasRating: selectedProject.dpasRating || '',
        chassisEta: selectedProject.chassisEta || '',
        fabricationStart: selectedProject.fabricationStart || '',
        assemblyStart: selectedProject.assemblyStart || '',
        wrapGraphics: selectedProject.wrapGraphics || '',
        ntcTesting: selectedProject.ntcTesting || '',
        qcStart: selectedProject.qcStart || '',
        executiveReview: selectedProject.executiveReview || '',
        ship: selectedProject.ship || '',
      });
    }
  }, [selectedProject, showEditDialog, form]);

  const onSubmit = (data: EditProjectFormValues) => {
    editProjectMutation.mutate(data);
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
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Projects from Excel</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 space-y-4">
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
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background border-b">
                        <tr className="bg-muted/50">
                          <th className="p-2 text-left">Project Number</th>
                          <th className="p-2 text-left">Location</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Ship</th>
                          <th className="p-2 text-left">Delivery</th>
                          <th className="p-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 3).map((project, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="p-2">{project.projectNumber || '-'}</td>
                            <td className="p-2">{project.location || '-'}</td>
                            <td className="p-2">{project.status || '-'}</td>
                            <td className="p-2">{project.ship ? formatDate(project.ship) : '-'}</td>
                            <td className="p-2">{project.delivery ? formatDate(project.delivery) : '-'}</td>
                            <td className="p-2">
                              <div className="max-w-[200px] truncate">
                                {project.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {previewData.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    ...and {previewData.length - 3} more projects
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Note: The import will map all available columns from your Excel sheet to the corresponding project fields.
                  Make sure your Excel sheet includes column headers that match the project fields.
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
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
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                    <span>{project.location || 'N/A'}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:text-red-500"
                                    onClick={(e) => handleDeleteClick(project, e)}
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3 text-red-500" />
                                  </Button>
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
                                onValueChange={handleStatusChange}
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
                      <div className="space-y6">

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
                                  <span>Executive Review:</span>
                                  <span>{formatDate(selectedProject.executiveReview)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ship Date:</span>
                                  <span>{formatDate(selectedProject.ship)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery:</span>
                                  <span>{formatDate(selectedProject.delivery)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <RichTextEditor
                                key={selectedProject.id}
                                content={selectedProject.notes || ''}
                                onChange={handleNotesChange}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Select a project to view details
                      </div>
                    )}
                  </CardContent>
                </Card>
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
              Are you sure you want to manually override the project status? 
              This will prevent automatic status updates based on project dates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="projectNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="team"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contractDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chassisEta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chassis ETA</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fabricationStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fabrication Start</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assemblyStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assembly Start</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="wrapGraphics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wrap Graphics</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ntcTesting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NTC Testing</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="qcStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QC Start</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="executiveReview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Executive Review</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="ship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ship Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={editProjectMutation.isPending}
            >
              {editProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
    </div>
  );
}