import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProductionTimeline } from "./ProductionTimeline";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { ResourceManagementPanel } from "./ResourceManagementPanel";
import { 
  faFolder, 
  faCircleDot, 
  faCheckCircle, 
  faEdit, 
  faRotateLeft, 
  faLocationDot, 
  faGrid2, 
  faTable, 
  faArrowUp, 
  faArrowDown, 
  faFileImport,
  faUsers,
  faPlus,
  faSpinner,
  faEye,
  faCloud,
  faCloudCheck,
  faCloudArrowUp
} from '@fortawesome/pro-light-svg-icons';
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectMapView } from "./production/ProjectMapView";
import { ProjectTableView } from "./production/ProjectTableView";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, ProjectStatus } from "@/types/manufacturing";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { z } from "zod";

function formatDate(dateString?: string) {
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
}

function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
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

function calculateQCDays(project: Project | null): number {
  if (!project || !project.qcStart) return 0;

  const endDate = project.executiveReview || project.ship;
  if (!endDate) return 0;

  return calculateWorkingDays(project.qcStart, endDate);
}

function calculateNTCDays(project: Project | null): number {
  if (!project || !project.ntcTesting || !project.qcStart) return 0;
  return calculateWorkingDays(project.ntcTesting, project.qcStart);
}

function calculateProjectStatus(project: Project | null): ProjectStatus {
  if (!project) return "NOT STARTED";

  if (project.manualStatus) {
    return project.status;
  }

  const today = new Date();
  const getValidDate = (date: string | null | undefined) => date ? new Date(date) : null;

  const dates = {
    fabricationStart: getValidDate(project.fabricationStart),
    assemblyStart: getValidDate(project.assemblyStart),
    wrapGraphics: getValidDate(project.wrapGraphics),
    ntcTesting: getValidDate(project.ntcTesting),
    qcStart: getValidDate(project.qcStart),
    ship: getValidDate(project.ship)
  };

  if (dates.ship && today >= dates.ship) {
    return "COMPLETED";
  }

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

  return "NOT STARTED";
}

const defaultFormValues = {
  projectNumber: "",
  location: "",
  team: "",
  contractDate: "",
  ntcTesting: "",
  qcStart: "",
  executiveReview: "",
  executiveReviewTime: "",
  ship: "",
  delivery: "",
  notes: "",
  meAssigned: "",
  meCadProgress: 0,
  eeAssigned: "",
  eeDesignProgress: 0,
  itAssigned: "",
  itDesignProgress: 0,
  ntcAssigned: "",
  ntcDesignProgress: 0,
  fabricationStart: "",
  assemblyStart: "",
  wrapGraphics: ""
};

const formSchema = z.object({
  projectNumber: z.string(),
  location: z.string().optional(),
  team: z.string().optional(),
  contractDate: z.string().optional(),
  ntcTesting: z.string().optional(),
  qcStart: z.string().optional(),
  executiveReview: z.string().optional(),
  executiveReviewTime: z.string().optional(),
  ship: z.string().optional(),
  delivery: z.string().optional(),
  notes: z.string().optional(),
  meAssigned: z.string().optional(),
  meCadProgress: z.number().optional(),
  eeAssigned: z.string().optional(),
  eeDesignProgress: z.number().optional(),
  itAssigned: z.string().optional(),
  itDesignProgress: z.number().optional(),
  ntcAssigned: z.string().optional(),
  ntcDesignProgress: z.number().optional(),
  fabricationStart: z.string().optional(),
  assemblyStart: z.string().optional(),
  wrapGraphics: z.string().optional()
});


const ProjectCreateDialog = ({ project, onClose }: { project?: Project, onClose?: () => void }) => (
  <div>
    {project && <p>Editing Project: {project.projectNumber}</p>}
    {onClose && <button onClick={onClose}>Close</button>}
  </div>
);

export function ProjectManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"location" | "qcStart" | "ship" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "map" | "table">("list");

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
        setSelectedProject({
          ...updatedProject,
          status: calculateProjectStatus(updatedProject)
        });
      }
    }
  }, [projects, selectedProject]);

  const updateProjectMutation = useMutation({
    mutationFn: async (project: Partial<Project>) => {
      console.log('Starting mutation with project data:', project);

      const cleanedData = {
        ...project,
        ...(project.ntcTesting && { ntcTesting: new Date(project.ntcTesting).toISOString() }),
        ...(project.qcStart && { qcStart: new Date(project.qcStart).toISOString() }),
        ...(project.executiveReview && { executiveReview: new Date(project.executiveReview).toISOString() }),
        ...(project.ship && { ship: new Date(project.ship).toISOString() }),
        ...(project.delivery && { delivery: new Date(project.delivery).toISOString() }),
        ...(project.fabricationStart && { fabricationStart: new Date(project.fabricationStart).toISOString() }),
        ...(project.assemblyStart && { assemblyStart: new Date(project.assemblyStart).toISOString() }),
        ...(project.wrapGraphics && { wrapGraphics: new Date(project.wrapGraphics).toISOString() })
      };

      console.log('Sending API request with data:', cleanedData);

      const response = await fetch(`/api/manufacturing/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to update project: ${errorText}`);
      }

      const result = await response.json();
      console.log('API success response:', result);
      return result;
    },
    onSuccess: (updatedProject) => {
      console.log('Mutation succeeded:', updatedProject);
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
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

      const aDate = a[sortField] ? new Date(a[sortField]).getTime() : sortDirection === "asc" ? Infinity : -Infinity;
      const bDate = b[sortField] ? new Date(b[sortField]).getTime() : sortDirection === "asc" ? Infinity : -Infinity;

      return sortDirection === "asc"
        ? aDate - bDate
        : bDate - aDate;
    });

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedProject) return;

    console.log('Form submitted with data:', data);
    const formattedData = {
      ...data,
      id: selectedProject.id
    };

    updateProjectMutation.mutate(formattedData);
  };

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const response = await fetch(`/api/manufacturing/projects/${id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      toast({
        title: "Success",
        description: "Notes updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update notes",
        variant: "destructive"
      });
    }
  });

  const handleEditProject = async (project: Project) => {
    try {
      // Fetch latest project data
      const response = await fetch(`/api/manufacturing/projects/${project.id}`);
      if (!response.ok) throw new Error('Failed to fetch project details');
      const projectData = await response.json();

      setSelectedProject(projectData);
      form.reset({
        projectNumber: projectData.projectNumber,
        location: projectData.location || '',
        team: projectData.team || '',
        contractDate: formatDateForInput(projectData.contractDate),
        ntcTesting: formatDateForInput(projectData.ntcTesting),
        qcStart: formatDateForInput(projectData.qcStart),
        executiveReview: formatDateForInput(projectData.executiveReview),
        executiveReviewTime: projectData.executiveReview ? new Date(projectData.executiveReview).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
        ship: formatDateForInput(projectData.ship),
        delivery: formatDateForInput(projectData.delivery),
        notes: projectData.notes || '',
        meAssigned: projectData.meAssigned || '',
        meCadProgress: projectData.meCadProgress || 0,
        eeAssigned: projectData.eeAssigned || '',
        eeDesignProgress: projectData.eeDesignProgress || 0,
        itAssigned: projectData.itAssigned || '',
        itDesignProgress: projectData.itDesignProgress || 0,
        ntcAssigned: projectData.ntcAssigned || '',
        ntcDesignProgress: projectData.ntcDesignProgress || 0,
        fabricationStart: formatDateForInput(projectData.fabricationStart),
        assemblyStart: formatDateForInput(projectData.assemblyStart),
        wrapGraphics: formatDateForInput(projectData.wrapGraphics)
      });
      setShowEditDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive"
      });
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
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
            <FontAwesomeIcon icon="file-import" className="h-4 w-4" />
            Import Excel
          </Button>
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
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            Resource Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Tabs defaultValue="list" className="space-y-4">
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
                                <div className="flex gap-2 text-xs text-muted-foreground">
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

                        <Card>
                          <CardHeader>
                            <CardTitle>Notes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedProject && (
                                <RichTextEditor
                                  key={selectedProject.id}
                                  content={selectedProject.notes || ''}
                                  onChange={async (content) => {
                                    try {
                                      const response = await fetch(`/api/manufacturing/projects/${selectedProject.id}/notes`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ notes: content })
                                      });

                                      if (!response.ok) throw new Error('Failed to save notes');

                                      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
                                        if (!oldData) return [];
                                        return oldData.map(p =>
                                          p.id === selectedProject.id
                                            ? { ...p, notes: content }
                                            : p
                                        );
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to save notes",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>

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
                                      <p className="text-sm text-muted-foreground">
                                        {task.assignee}
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
              <ProjectMapView projects={projects} />
            </TabsContent>

            <TabsContent value="table">
              <ProjectTableView
                projects={projects}
                onEdit={handleEditProject}
                onView={handleViewProject}
              />
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
              Are you sure you want to manually change the project status? This will override the automatic status calculation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ME Assigned</Label>
                    <Select value={form.getValues("meAssigned")} onValueChange={(value) => form.setValue("meAssigned", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ME" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kevin Elliott">Kevin Elliott</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ME CAD %</Label>
                    <Input type="number" {...form.register("meCadProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>EE Assigned</Label>
                    <Select value={form.getValues("eeAssigned")} onValueChange={(value) => form.setValue("eeAssigned", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select EE" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nick S">Nick S</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>EE Design/Orders %</Label>
                    <Input type="number" {...form.register("eeDesignProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>IT Assigned</Label>
                    <Select value={form.getValues("itAssigned")} onValueChange={(value) => form.setValue("itAssigned", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select IT" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>IT Design/Orders %</Label>
                    <Input type="number" {...form.register("itDesignProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>NTC Assigned</Label>
                    <Select value={form.getValues("ntcAssigned")} onValueChange={(value) => form.setValue("ntcAssigned", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select NTC" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>NTC Design/Orders %</Label>
                    <Input type="number" {...form.register("ntcDesignProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fabrication Start</Label>
                    <Input type="date" {...form.register("fabricationStart")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Assembly Start</Label>
                    <Input type="date" {...form.register("assemblyStart")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Wrap/Graphics</Label>
                    <Input type="date" {...form.register("wrapGraphics")} />
                  </div>
                  <div className="space-y-2">
                    <Label>NTC Testing</Label>
                    <Input type="date" {...form.register("ntcTesting")} />
                  </div>
                  <div className="space-y-2">
                    <Label>QC Start</Label>
                    <Input type="date" {...form.register("qcStart")} />
                  </div>
                  <div className="space-y-2">
                    <Label>QC Days</Label>
                    <div className={`text-sm font-medium ${getDaysColor(calculateQCDays(selectedProject))}`}>
                      {calculateQCDays(selectedProject)} days
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Executive Review</Label>
                    <div className="flex gap-2">
                      <Input type="date" {...form.register("executiveReview")} />
                      <Input type="time" {...form.register("executiveReviewTime")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ship</Label>
                    <Input type="date" {...form.register("ship")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery</Label>
                    <Input type="date" {...form.register("delivery")} />
                  </div>
                  <div className="space-y-2">
                    <Label>NTC Days</Label>
                    <div className={`text-sm font-medium ${getDaysColor(calculateNTCDays(selectedProject))}`}>
                      {calculateNTCDays(selectedProject)} days
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t p-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}