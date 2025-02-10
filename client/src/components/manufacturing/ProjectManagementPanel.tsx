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
  faCloudArrowUp,
  faTrash
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
  dpasRating: "",
  chassisEta: "",
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
  dpasRating: z.string().optional(),
  chassisEta: z.string().optional(),
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
  wrapGraphics: z.string().optional(),
  ntcDays: z.string().optional(),
  qcDays: z.string().optional()
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
  const [sortConfig, setSortConfig] = useState<{
    primary: "location" | "qcStart" | "ship" | null;
    secondary: "qcStart" | "ship" | null;
    direction: "asc" | "desc";
  }>({
    primary: "ship", // Default sort by ship date
    secondary: null,
    direction: "asc"  // Closest dates first
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "map" | "table">("list");
  const [locationFilter, setLocationFilter] = useState<"ALL" | "LIBBY" | "CFALLS">("ALL");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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
    setSortConfig(current => {
      if (current.primary === field) {
        return {
          ...current,
          direction: current.direction === "asc" ? "desc" : "asc"
        };
      }

      if (field === "location") {
        return {
          primary: field,
          secondary: current.primary === "location" ?
            (current.secondary === "ship" ? "qcStart" : "ship") : // Toggle between ship and qc
            "ship", // Default to ship
          direction: "asc"
        };
      }

      return {
        primary: field,
        secondary: null,
        direction: "asc"
      };
    });
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
    .filter(project => {
      const matchesSearch = (
        (project.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (project.projectNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );

      const matchesLocation = locationFilter === "ALL" ? true :
        (project.location || '').toUpperCase() === locationFilter;

      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.primary === "location") {
        const aLocation = (a.location || '').toLowerCase();
        const bLocation = (b.location || '').toLowerCase();
        const locationCompare = aLocation.localeCompare(bLocation);

        if (locationCompare !== 0) return locationCompare * direction;

        if (sortConfig.secondary === "ship" || sortConfig.secondary === "qcStart") {
          const aDate = a[sortConfig.secondary];
          const bDate = b[sortConfig.secondary];

          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;

          return (new Date(aDate).getTime() - new Date(bDate).getTime()) * direction;
        }
      } else if (sortConfig.primary === "ship" || sortConfig.primary === "qcStart") {
        const aDate = a[sortConfig.primary];
        const bDate = b[sortConfig.primary];

        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;

        return (new Date(aDate).getTime() - new Date(bDate).getTime()) * direction;
      }

      return 0;
    });

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const updateDaysCalculations = (data: z.infer<typeof formSchema>) => {
    if (data.ntcTesting && data.qcStart) {
      const ntcDays = calculateWorkingDays(data.ntcTesting, data.qcStart);
      form.setValue("ntcDays", ntcDays.toString(), { shouldValidate: true });
    }

    if (data.qcStart && (data.executiveReview || data.ship)) {
      const endDate = data.executiveReview || data.ship;
      if (endDate) {
        const qcDays = calculateWorkingDays(data.qcStart, endDate);
        form.setValue("qcDays", qcDays.toString(), { shouldValidate: true });
      }
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedProject) return;

    console.log('Form submitted with data:', data);

    // Calculate days before formatting data
    const ntcDays = data.ntcTesting && data.qcStart ?
      calculateWorkingDays(new Date(data.ntcTesting), new Date(data.qcStart)) : 0;

    const qcDays = data.qcStart && data.executiveReview ?
      calculateWorkingDays(new Date(data.qcStart), new Date(data.executiveReview)) : 0;

    const formattedData = {
      id: selectedProject.id,
      projectNumber: data.projectNumber,
      location: data.location,
      team: data.team,
      contractDate: data.contractDate,
      dpasRating: data.dpasRating,
      chassisEta: data.chassisEta,
      ntcTesting: data.ntcTesting,
      qcStart: data.qcStart,
      executiveReview: data.executiveReview,
      executiveReviewTime: data.executiveReviewTime,
      ship: data.ship,
      delivery: data.delivery,
      notes: data.notes,
      meAssigned: data.meAssigned,
      meCadProgress: Number(data.meCadProgress || 0),
      eeAssigned: data.eeAssigned,
      eeDesignProgress: Number(data.eeDesignProgress || 0),
      itAssigned: data.itAssigned,
      itDesignProgress: Number(data.itDesignProgress || 0),
      ntcAssigned: data.ntcAssigned,
      ntcDesignProgress: Number(data.ntcDesignProgress || 0),
      fabricationStart: data.fabricationStart,
      assemblyStart: data.assemblyStart,
      wrapGraphics: data.wrapGraphics,
      ntcDays: ntcDays.toString(),
      qcDays: qcDays.toString()
    };

    try {
      await updateProjectMutation.mutateAsync(formattedData);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive"
      });
    }
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

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/manufacturing/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to delete project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      setProjectToDelete(null);
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive"
      });
    }
  });


  const handleEditProject = async (project: Project) => {
    try {
      const response = await fetch(`/api/manufacturing/projects/${project.id}`);
      if (!response.ok) throw new Error('Failed to fetch project details');
      const projectData = await response.json();

      setSelectedProject(projectData);
      form.reset({
        projectNumber: projectData.projectNumber || '',
        location: projectData.location || '',
        team: projectData.team || '',
        contractDate: formatDateForInput(projectData.contractDate),
        dpasRating: projectData.dpasRating || '',
        chassisEta: projectData.chassisEta || '',
        ntcTesting: formatDateForInput(projectData.ntcTesting),
        qcStart: formatDateForInput(projectData.qcStart),
        executiveReview: formatDateForInput(projectData.executiveReview),
        executiveReviewTime: projectData.executiveReview ? new Date(projectData.executiveReview).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
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
        wrapGraphics: formatDateForInput(projectData.wrapGraphics),
        ntcDays: projectData.ntcDays || '',
        qcDays: projectData.qcDays || ''
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

  const initializeEditForm = (project: Project) => {
    handleEditProject(project);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
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
          <Button onClick={() => setShowEditDialog(true)}>
            <FontAwesomeIcon icon="plus" className="h-4 w-4 mr-2" />
            Create Project
          </Button>
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
                      <FontAwesomeIcon icon={faFolder} className="h-4 w-4" />
                      <span>Projects</span>
                    </CardTitle>
                  </</CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Search projects..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Select
                          value={locationFilter}
                          onValueChange={(value: "ALL" | "LIBBY" | "CFALLS") => setLocationFilter(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All Locations</SelectItem>
                            <SelectItem value="LIBBY">Libby</SelectItem>
                            <SelectItem value="CFALLS">CFalls</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2 mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSort("qcStart")}
                          >
                            QC Date
                            {sortConfig.primary === "qcStart" && (
                              <FontAwesomeIcon
                                icon={sortConfig.direction === "asc" ? faArrowUp : faArrowDown}
                                className="h-4 w-4 ml-2"
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
                            {sortConfig.primary === "ship" && (
                              <FontAwesomeIcon
                                icon={sortConfig.direction === "asc" ? faArrowUp : faArrowDown}
                                className="h-4 w-4 ml-2"
                              />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {filteredAndSortedProjects.map(project => (
                          <Card
                            key={project.id}
                            className={`relative group hover:shadow-md transition-shadow ${
                              selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-sm font-medium">
                                      {project.projectNumber}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                                      <span>{project.location || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={`${getStatusColor(project.status)} text-white text-xs`}
                                  >
                                    {project.status}
                                  </Badge>
                                </div>

                                {/* Timeline */}
                                <div className="relative px-1 py-1 overflow-hidden">
                                  <ProductionTimeline project={project} />
                                </div>

                                {/* Details */}
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>QC: {formatDate(project.qcStart)}</span>
                                  <span>Ship: {formatDate(project.ship)}</span>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewProject(project)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditProject(project)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteProject(project)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
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
                            <Button variant="outline" onClick={() => initializeEditForm(selectedProject)}>
                              <FontAwesomeIcon icon={faEdit} className="mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleResetStatus(selectedProject.id)}
                              disabled={!selectedProject.manualStatus}
                            >
                              <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />
                              Reset Status
                            </Button>
                            <div className="flex gap-2">
                              <Select
                                value={selectedProject?.status || "NOT STARTED"}
                                onValueChange={(value: ProjectStatus) => handleStatusChange(value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue>
                                    <div className={`px-3 py-1 rounded-full text-white ${getStatusColor(selectedProject?.status || "NOT STARTED")}`}>
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
                              {selectedProject?.manualStatus && (
                                <div className="text-red-500 text-sm font-medium">
                                  (Manual Override)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>Select a project to view details</div>
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
                                  <span>Executive Review:</span>
                                  <span>
                                    {selectedProject.executiveReview ? (
                                      <span>
                                        {formatDate(selectedProject.executiveReview)}
                                        {selectedProject.executiveReviewTime && (
                                          <span className="ml-1 text-muted-foreground">
                                            {selectedProject.executiveReviewTime}
                                          </span>
                                        )}
                                      </span>
                                    ) : '-'}
                                  </span>
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
            <DialogTitle>Edit Project {selectedProject?.projectNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Number</Label>
                    <Input {...form.register("projectNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select
                      defaultValue={form.getValues("location")}
                      onValueChange={(value) => form.setValue("location", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Libby">Libby</SelectItem>
                        <SelectItem value="CFalls">CFalls</SelectItem>
                        <SelectItem value="FSW">FSW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Input {...form.register("team")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Date</Label>
                    <Input type="date" {...form.register("contractDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label>DPAS Rating</Label>
                    <Input {...form.register("dpasRating")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Chassis ETA</Label>
                    <Input {...form.register("chassisEta")} />
                  </div>
                  <div className="space-y-2">
                    <Label>ME Assigned</Label>
                    <Input {...form.register("meAssigned")} />
                  </div>
                  <div className="space-y-2">
                    <Label>ME CAD %</Label>
                    <Input type="number" {...form.register("meCadProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>EE Assigned</Label>
                    <Input {...form.register("eeAssigned")} />
                  </div>
                  <div className="space-y-2">
                    <Label>EE Design/Orders %</Label>
                    <Input type="number" {...form.register("eeDesignProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>IT Assigned</Label>
                    <Input {...form.register("itAssigned")} />
                  </div>
                  <div className="space-y-2">
                    <Label>IT Design/Orders %</Label>
                    <Input type="number" {...form.register("itDesignProgress")} />
                  </div>
                  <div className="space-y-2">
                    <Label>NTC Assigned</Label>
                    <Input {...form.register("ntcAssigned")} />
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
                    <Input
                      type="date"
                      {...form.register("ntcTesting")}
                      onChange={(e) => {
                        form.setValue("ntcTesting", e.target.value, { shouldValidate: true });
                        const qcStart = form.getValues("qcStart");
                        if (e.target.value && qcStart) {
                          const days = calculateWorkingDays(new Date(e.target.value), new Date(qcStart));
                          form.setValue("ntcDays", days.toString());
                          console.log('Updated NTC Days:', days);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>QC Start</Label>
                    <Input
                      type="date"
                      {...form.register("qcStart")}
                      onChange={(e) => {
                        form.setValue("qcStart", e.target.value, { shouldValidate: true });
                        const ntcTesting = form.getValues("ntcTesting");
                        const executiveReview = form.getValues("executiveReview");
                        if (ntcTesting && e.target.value) {
                          const ntcDays = calculateWorkingDays(new Date(ntcTesting), new Date(e.target.value));
                          form.setValue("ntcDays", ntcDays, { shouldValidate: true });
                        }
                        if (e.target.value && executiveReview) {
                          const qcDays = calculateWorkingDays(new Date(e.target.value), new Date(executiveReview));
                          form.setValue("qcDays", qcDays, { shouldValidate: true });
                        }
                      }}
                    />
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

                <div className="space-y-2 mt-4">
                  <Label>Notes</Label>
                  <RichTextEditor
                    content={selectedProject?.notes || ''}
                    onChange={(content) => form.setValue("notes", content)}
                  />
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete project {projectToDelete?.projectNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}