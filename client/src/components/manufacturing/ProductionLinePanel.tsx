import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast, useToast } from "@/hooks/use-toast";
import { ProductionHotProjectsGrid } from "./production/ProductionHotProjectsGrid";
import { ProductionScheduler } from "./production/ProductionScheduler";
import { BayScheduler } from "./production/BayScheduler";
import { ProductionAnalyticsDashboard } from "./production/ProductionAnalyticsDashboard";
import { ProductionPlanningDashboard } from "./production/ProductionPlanningDashboard";
import { ResourceManagement } from "./scheduling/ResourceManagement";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ProductionTimeline } from "./ProductionTimeline";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ProductionLine, ProductionBay, ProductionOrder, ProductionProject, Project } from "@/types/manufacturing";
import { ProjectFiltersRow } from "./ProjectFiltersRow";
import type { ProjectFilter } from "./ProjectFiltersRow";

// Define a comprehensive status type that handles all possible values
type ProjectStatus = 
  | 'active' 
  | 'in_progress' 
  | 'planning' 
  | 'on_hold' 
  | 'completed'
  | 'cancelled'
  | 'NOT_STARTED'
  | 'IN_FAB'
  | 'IN_ASSEMBLY'
  | 'IN_WRAP'
  | 'IN_NTC_TESTING'
  | 'IN_QC'
  | 'PLANNING'
  | 'COMPLETED';

// Combined project type to handle both Project and ProductionProject types
export type CombinedProject = (Project | ProductionProject) & {
  // Additional fields we might need to ensure exist on all projects
  metrics?: {
    completionPercentage?: number;
  };
  startDate?: string;
  targetCompletionDate?: string;
  contractDate?: string;
  delivery?: string;
  location?: string;
  // Standardized location display name (e.g., "Columbia Falls" instead of "CFalls")
  locationDisplay?: string;
  // Key production milestone dates
  fabricationStart?: string;
  assemblyStart?: string;
  ntcTesting?: string;
  qcStart?: string;
  executiveReview?: string;
  ship?: string;
  notes?: string | {
    id: string;
    content: string;
    author: string;
    timestamp: string;
    type: 'general' | 'issue' | 'milestone';
  }[];
  completionDate?: string;
  duration?: number;
  progress?: number;
  isDelayed?: boolean;
  planningStage?: string;
  // Additional fields for production wrapping
  wrapGraphics?: string;
  // Override status with our comprehensive type
  status: ProjectStatus;
};

// We're using the ProjectFilter interface imported from ProjectFiltersRow.tsx

// Helper function to safely format dates with fallbacks
const formatDate = (date: string | undefined | null, fallbackDate?: string | null): string => {
  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
  }
  
  if (fallbackDate) {
    const parsedFallbackDate = new Date(fallbackDate);
    if (!isNaN(parsedFallbackDate.getTime())) {
      return parsedFallbackDate.toLocaleDateString();
    }
  }
  
  return 'TBD';
};

export const ProductionLinePanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [assignProjectDialogOpen, setAssignProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProductionProject | null>(null);
  const [selectedLineForAssignment, setSelectedLineForAssignment] = useState<string | null>(null);
  const [projectDetailsDialogOpen, setProjectDetailsDialogOpen] = useState(false);
  const [projectNotes, setProjectNotes] = useState<string>("");
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  
  // Filter states for each tab
  const [activeFilters, setActiveFilters] = useState<ProjectFilter>({
    productionLine: '',
    location: '',
    sortBy: 'none',
    sortDirection: 'asc',
    sortMode: 'standard'
  });
  const [planningFilters, setPlanningFilters] = useState<ProjectFilter>({
    productionLine: '',
    location: '',
    sortBy: 'none',
    sortDirection: 'asc',
    sortMode: 'standard'
  });
  const [completedFilters, setCompletedFilters] = useState<ProjectFilter>({
    productionLine: '',
    location: '',
    sortBy: 'none',
    sortDirection: 'asc',
    sortMode: 'standard'
  });
  
  // All projects tab filters
  const [allProjectsFilters, setAllProjectsFilters] = useState<ProjectFilter>({
    productionLine: '',
    location: '',
    sortBy: 'none',
    sortDirection: 'asc',
    sortMode: 'standard'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productionLines = [] } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    refetchInterval: 5000,
  });

  // Client-side data persistence cache to prevent data loss during errors
  const localProjectsCache = useRef<CombinedProject[]>([]);

  // CRITICAL DATA FETCH: Projects data with enhanced error handling and persistence
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<CombinedProject[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      console.log('Fetching projects data...');
      try {
        // Intentionally using fetch without AbortController to prevent timeout errors
        const response = await fetch('/api/manufacturing/projects', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Cache-Bust': Date.now().toString()
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} projects from server`);
        
        if (!Array.isArray(data)) {
          console.warn('Projects data is not an array');
          // If server returns non-array but we have cached data, use the cache
          if (localProjectsCache.current.length > 0) {
            console.log(`Using client-side cache with ${localProjectsCache.current.length} projects`);
            return localProjectsCache.current;
          }
          return [];
        }
        
        if (data.length === 0) {
          console.warn('Projects data array is empty');
          // If server returns empty but we have cached data, use the cache
          if (localProjectsCache.current.length > 0) {
            console.log(`Using client-side cache with ${localProjectsCache.current.length} projects`);
            return localProjectsCache.current;
          }
          return [];
        }
        
        // DEBUG: Log the actual project data for diagnosis
        console.log('First project from API:', JSON.stringify(data[0]));
        
        // Transform the projects to match our CombinedProject type with defensive coding
        const processedProjects = data.map((project: any) => {
          // Helper function to standardize location within the map function
          const standardizeLocation = (loc: string | undefined): string => {
            if (!loc) return '';
            return loc.toLowerCase() === 'cfalls' ? 'Columbia Falls' : loc;
          };
          
          return {
            ...project,
            id: project.id || `temp-${Date.now()}`, // Ensure ID always exists
            // Create a metrics object if it doesn't exist
            metrics: project.metrics || { 
              completionPercentage: project.progress || 0
            },
            // Make sure all common properties are available with fallbacks
            name: project.name || `Project #${project.projectNumber || 'Unknown'}`,
            startDate: project.startDate || project.contractDate,
            targetCompletionDate: project.targetCompletionDate || project.delivery,
            contractDate: project.contractDate || project.startDate,
            delivery: project.delivery || project.targetCompletionDate,
            completionDate: project.completionDate || project.actualCompletionDate,
            progress: project.progress || (project.metrics?.completionPercentage || 0),
            isDelayed: project.isDelayed || false,
            duration: project.duration || 0,
            planningStage: project.planningStage || 'initial',
            // Ensure status is always defined
            status: project.status || 'active',
            // Add standardized location display for consistent UI
            locationDisplay: standardizeLocation(project.location)
          };
        });
        
        // Debug: Verify processed data 
        console.log(`Processed ${processedProjects.length} projects`);
        console.log('First processed project:', JSON.stringify(processedProjects[0]));
        
        // Update our client-side cache with the fresh data
        if (processedProjects.length > 0) {
          localProjectsCache.current = processedProjects;
        }
        
        return processedProjects;
      } catch (error) {
        console.error("Critical error fetching projects:", error);
        
        // Return local cache if available, empty array as last resort
        if (localProjectsCache.current.length > 0) {
          console.log(`Error recovery: Using client-side cache with ${localProjectsCache.current.length} projects`);
          return localProjectsCache.current;
        }
        
        return [];
      }
    },
    // CRITICAL: Match settings with ProjectManagementPanel for data consistency
    refetchInterval: 1000,      // Match 1 second refresh rate with ProjectManagementPanel
    refetchOnMount: "always",   // Always refresh when component mounts
    refetchOnWindowFocus: true, // Refresh when window regains focus
    staleTime: 0,               // Match ProjectManagementPanel setting - always refetch
    gcTime: Infinity,           // Never garbage collect the data
    retry: 10,                  // Increased retries for better reliability
    retryDelay: 1000,           // Increased retry delay to give server more time
    refetchOnReconnect: true,   // Refetch when reconnecting network
    retryOnMount: true
  });

  const { data: bays = [] } = useQuery<ProductionBay[]>({
    queryKey: ['/api/manufacturing/bays', selectedLineId],
    enabled: !!selectedLineId,
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const { data: orders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/manufacturing/orders', selectedLineId],
    enabled: !!selectedLineId,
    staleTime: 3600000,
    gcTime: 3600000,
  });
  
  // Mutation for assigning a project to a production line
  const assignProjectMutation = useMutation({
    mutationFn: async ({ projectId, lineId }: { projectId: string, lineId: string }) => {
      // This would be a real API call in production:
      // return await fetch(`/api/manufacturing/projects/${projectId}/assign-line`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ lineId })
      // }).then(res => res.json());
      
      // For demo, we're just logging and returning a success response
      console.log(`Assigned project ${projectId} to line ${lineId}`);
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      if (selectedLineId) {
        queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/orders', selectedLineId] });
      }
      
      // Show success toast
      toast({
        title: "Project assigned successfully",
        description: "The project has been assigned to the production line.",
      });
      
      // Close the dialog
      setAssignProjectDialogOpen(false);
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Failed to assign project",
        description: "There was an error assigning the project. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to assign project:", error);
    }
  });
  
  const handleLineChange = (lineId: string) => {
    setSelectedLineId(lineId);
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/bays', lineId] });
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/orders', lineId] });
  };
  
  const handleAssignProject = (project: CombinedProject) => {
    setSelectedProject(project as ProductionProject);
    setAssignProjectDialogOpen(true);
  };
  
  const confirmAssignProject = () => {
    if (selectedProject && selectedLineForAssignment) {
      assignProjectMutation.mutate({
        projectId: selectedProject.id,
        lineId: selectedLineForAssignment
      });
    }
  };
  
  // Mutation for updating project notes
  const updateProjectNotesMutation = useMutation({
    mutationFn: async ({ projectId, notes }: { projectId: string, notes: string }) => {
      const response = await fetch(`/api/manufacturing/projects/${projectId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project notes');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Notes updated successfully",
        description: "Project notes have been saved.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      setIsUpdatingNotes(false);
    },
    onError: (error) => {
      console.error("Failed to update notes:", error);
      toast({
        title: "Failed to update notes",
        description: "There was an error saving the project notes. Please try again.",
        variant: "destructive",
      });
      setIsUpdatingNotes(false);
    }
  });
  
  const handleOpenProjectDetails = (project: CombinedProject) => {
    setSelectedProject(project as ProductionProject);
    setSelectedProjectId(project.id);
    
    // Convert notes to string format for editing if they're in array format
    let notesString = "";
    if (typeof project.notes === 'string') {
      notesString = project.notes;
    } else if (Array.isArray(project.notes)) {
      notesString = project.notes.map(note => note.content).join('\n');
    }
    
    setProjectNotes(notesString);
    setProjectDetailsDialogOpen(true);
  };
  
  const handleUpdateProjectNotes = () => {
    if (selectedProject) {
      setIsUpdatingNotes(true);
      updateProjectNotesMutation.mutate({
        projectId: selectedProject.id,
        notes: projectNotes
      });
    }
  };

  // Helper function to safely filter projects with enhanced debugging
  const safeFilterProjects = (projects: CombinedProject[], condition: (project: CombinedProject) => boolean): CombinedProject[] => {
    if (!Array.isArray(projects)) {
      console.warn("Projects is not an array:", projects);
      return [];
    }
    
    if (projects.length === 0) {
      console.warn("Projects array is empty");
      return [];
    }
    
    // Log the first few projects and their statuses for debugging
    console.log("First 3 projects with statuses:", 
      projects.slice(0, 3).map(p => ({ 
        id: p.id, 
        name: p.name, 
        status: p.status,
        projectNumber: p.projectNumber
      }))
    );
    
    // Count projects by status (for debugging)
    const statusCounts: Record<string, number> = {};
    projects.forEach(project => {
      const status = String(project.status || 'unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log("Project status distribution:", statusCounts);
    
    return projects.filter(condition);
  };
  
  // Helper function to categorize projects by status
  const isActiveProject = (project: CombinedProject): boolean => {
    const status = String(project.status || '').toUpperCase();
    // Active projects are those in production but not completed
    return ['IN_FAB', 'IN_ASSEMBLY', 'IN_WRAP', 'IN_NTC_TESTING', 'IN_QC', 'active', 'in_progress'].includes(status);
  };
  
  const isPlanningProject = (project: CombinedProject): boolean => {
    const status = String(project.status || '').toUpperCase();
    // Planning projects haven't started production yet
    return ['NOT_STARTED', 'PLANNING', 'planning', 'on_hold'].includes(status);
  };
  
  const isCompletedProject = (project: CombinedProject): boolean => {
    const status = String(project.status || '').toUpperCase();
    // Completed or cancelled projects
    return ['COMPLETED', 'completed', 'cancelled'].includes(status);
  };
  
  // Helper functions for filtering projects based on filter criteria
  // Helper function to standardize location display
  const standardizeLocationDisplay = (location: string | undefined): string => {
    if (!location) return '';
    
    // Standardize CFalls/Cfalls to Columbia Falls
    if (location.toLowerCase() === 'cfalls') {
      return 'Columbia Falls';
    }
    
    return location;
  };
  
  const applyFilters = (projects: CombinedProject[], filters: ProjectFilter): CombinedProject[] => {
    // First apply filters
    let filteredProjects = projects.filter(project => {
      // Filter by production line if selected
      if (filters.productionLine && filters.productionLine !== 'all') {
        // For this implementation we'll use team property as a proxy for production line 
        // since the current data model doesn't have a productionLine property
        const isAssignedToTeam = project.team && project.team.includes(filters.productionLine);
        if (!isAssignedToTeam) {
          return false;
        }
      }
      
      // Filter by location if selected
      if (filters.location && filters.location !== 'all' && project.location !== filters.location) {
        return false;
      }
      
      return true;
    });
    
    // Then apply sorting if specified
    if (filters.sortBy !== 'none') {
      filteredProjects = [...filteredProjects].sort((a, b) => {
        const today = new Date();
        let dateA: Date | null = null;
        let dateB: Date | null = null;
        
        // Get the appropriate dates based on sort field
        switch (filters.sortBy) {
          case 'ntcDate':
            dateA = a.ntcTesting ? new Date(a.ntcTesting) : null;
            dateB = b.ntcTesting ? new Date(b.ntcTesting) : null;
            break;
          case 'qcDate':
            dateA = a.qcStart ? new Date(a.qcStart) : null;
            dateB = b.qcStart ? new Date(b.qcStart) : null;
            break;
          case 'shipDate':
            dateA = a.ship ? new Date(a.ship) : null;
            dateB = b.ship ? new Date(b.ship) : null;
            break;
        }
        
        // Handle null dates (push them to the end)
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        // If using proximity-based sorting, sort by distance from current date
        if (filters.sortMode === 'proximity') {
          // Calculate proximity to today
          const diffA = Math.abs(dateA.getTime() - today.getTime());
          const diffB = Math.abs(dateB.getTime() - today.getTime());
          
          // Sort by distance from current date
          return filters.sortDirection === 'asc'
            ? diffA - diffB  // Ascending = closest dates first
            : diffB - diffA; // Descending = furthest dates first
        }
        
        // Standard chronological sorting
        return filters.sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime()  // Chronological order (arrow up)
          : dateB.getTime() - dateA.getTime(); // Reverse chronological order (arrow down)
      });
    }
    
    // Add standardized location display to projects
    return filteredProjects.map(project => ({
      ...project,
      locationDisplay: standardizeLocationDisplay(project.location)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Manufacturing Operations</h1>
          <p className="text-muted-foreground">
            Manage production planning, scheduling, and resource allocation
          </p>
        </div>
        <div className="flex space-x-2">
          {activeTab === "projects" && (
            <Button
              onClick={() => {
                console.log("Invalidating projects query cache...");
                queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
              }}
            >
              <FontAwesomeIcon icon="sync-alt" className="mr-2 h-4 w-4" />
              Refresh Projects
            </Button>
          )}
          {activeTab === "scheduling" && (
            <Select value={selectedLineId || ''} onValueChange={handleLineChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Production Line" />
              </SelectTrigger>
              <SelectContent>
                {productionLines.map(line => (
                  <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="industry" className="mr-2" />
            Production Overview
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FontAwesomeIcon icon="project-diagram" className="mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="planning">
            <FontAwesomeIcon icon="tasks" className="mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="scheduling">
            <FontAwesomeIcon icon="calendar" className="mr-2" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <FontAwesomeIcon icon="chart-pie" className="mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProductionHotProjectsGrid />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Production Projects</CardTitle>
                <CardDescription>Active and upcoming manufacturing projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Tabs defaultValue="active">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="planning">Planning</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="all">All Projects</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="space-y-4 pt-4">
                      {isLoadingProjects ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                          <span>Loading projects...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            // Filter active projects only once to prevent duplication
                            // Use our isActiveProject helper function to filter active projects
                            let activeProjects = safeFilterProjects(projects, isActiveProject);
                            
                            // Apply additional filters from the filter row
                            activeProjects = applyFilters(activeProjects, activeFilters);
                            
                            return (
                              <>
                                <ProjectFiltersRow 
                                  projects={activeProjects} 
                                  onFilterChange={setActiveFilters} 
                                  availableProductionLines={productionLines}
                                />
                                
                                {activeProjects.length > 0 ? (
                                  <div className="space-y-4">
                                    {activeProjects.map(project => (
                                      <Card 
                                        key={project.id} 
                                        className="cursor-pointer hover:bg-accent/5"
                                        onClick={() => handleOpenProjectDetails(project)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h3 className="font-medium">{project.name}</h3>
                                              <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                                            </div>
                                            <Badge variant="outline">{project.status}</Badge>
                                          </div>
                                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                              <p className="text-muted-foreground">Start Date</p>
                                              <p>{formatDate(project.startDate, project.contractDate)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Target Date</p>
                                              <p>{formatDate(project.targetCompletionDate, project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Progress</p>
                                              <Progress 
                                                value={project.metrics?.completionPercentage ?? project.progress ?? 0} 
                                                className="h-2 mt-1" 
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Production Timeline Component */}
                                          <ProductionTimeline project={project} />
                                          
                                          {/* Key Production Dates */}
                                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div>
                                              <p className="text-muted-foreground">Fabrication Start</p>
                                              <p>{formatDate(project.fabricationStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Assembly Start</p>
                                              <p>{formatDate(project.assemblyStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">NTC Testing</p>
                                              <p>{formatDate(project.ntcTesting)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">QC Start</p>
                                              <p>{formatDate(project.qcStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Executive Review</p>
                                              <p>{formatDate(project.executiveReview)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Ship Date</p>
                                              <p>{formatDate(project.ship)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Delivery</p>
                                              <p>{formatDate(project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Location</p>
                                              <p>{project.locationDisplay || project.location}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="mt-3 flex justify-end gap-2">
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAssignProject(project);
                                              }}
                                            >
                                              <FontAwesomeIcon icon="sitemap" className="mr-2 h-3 w-3" />
                                              Assign to Line
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FontAwesomeIcon icon="clipboard-check" className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
                                    <p className="text-muted-foreground">
                                      There are no active projects at the moment
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="planning" className="space-y-4 pt-4">
                      {isLoadingProjects ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                          <span>Loading projects...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            // Filter planning projects only once to prevent duplication
                            // Use our isPlanningProject helper function for consistent filtering
                            let planningProjects = safeFilterProjects(projects, isPlanningProject);
                            
                            // Apply additional filters from the filter row
                            planningProjects = applyFilters(planningProjects, planningFilters);
                            
                            return (
                              <>
                                <ProjectFiltersRow 
                                  projects={planningProjects} 
                                  onFilterChange={setPlanningFilters} 
                                  availableProductionLines={productionLines}
                                />
                                
                                {planningProjects.length > 0 ? (
                                  <div className="space-y-4">
                                    {planningProjects.map(project => (
                                      <Card 
                                        key={project.id} 
                                        className="cursor-pointer hover:bg-accent/5"
                                        onClick={() => handleOpenProjectDetails(project)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h3 className="font-medium">{project.name}</h3>
                                              <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                                            </div>
                                            <Badge variant="outline">{project.status}</Badge>
                                          </div>
                                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                              <p className="text-muted-foreground">Start Date</p>
                                              <p>{formatDate(project.startDate, project.contractDate)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Target Date</p>
                                              <p>{formatDate(project.targetCompletionDate, project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Planning Status</p>
                                              <p>{project.planningStage || 'Initial'}</p>
                                            </div>
                                          </div>
                                          
                                          {/* Production Timeline Component */}
                                          <ProductionTimeline project={project} />
                                          
                                          {/* Key Production Dates */}
                                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div>
                                              <p className="text-muted-foreground">Fabrication Start</p>
                                              <p>{formatDate(project.fabricationStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Assembly Start</p>
                                              <p>{formatDate(project.assemblyStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">NTC Testing</p>
                                              <p>{formatDate(project.ntcTesting)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">QC Start</p>
                                              <p>{formatDate(project.qcStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Executive Review</p>
                                              <p>{formatDate(project.executiveReview)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Ship Date</p>
                                              <p>{formatDate(project.ship)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Delivery</p>
                                              <p>{formatDate(project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Location</p>
                                              <p>{project.locationDisplay || project.location}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="mt-3 flex justify-end gap-2">
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAssignProject(project);
                                              }}
                                            >
                                              <FontAwesomeIcon icon="sitemap" className="mr-2 h-3 w-3" />
                                              Assign to Line
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Projects in Planning</h3>
                                    <p className="text-muted-foreground">
                                      There are no projects in the planning stage
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="completed" className="space-y-4 pt-4">
                      {isLoadingProjects ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                          <span>Loading projects...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            // Filter completed projects only once to prevent duplication
                            // Use our isCompletedProject helper function for consistent filtering
                            let completedProjects = safeFilterProjects(projects, isCompletedProject);
                            
                            // Apply additional filters from the filter row
                            completedProjects = applyFilters(completedProjects, completedFilters);
                            
                            return (
                              <>
                                <ProjectFiltersRow 
                                  projects={completedProjects} 
                                  onFilterChange={setCompletedFilters} 
                                  availableProductionLines={productionLines}
                                />
                                
                                {completedProjects.length > 0 ? (
                                  <div className="space-y-4">
                                    {completedProjects.map(project => (
                                      <Card 
                                        key={project.id} 
                                        className="cursor-pointer hover:bg-accent/5"
                                        onClick={() => handleOpenProjectDetails(project)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h3 className="font-medium">{project.name}</h3>
                                              <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                                            </div>
                                            <Badge variant="outline">{project.status}</Badge>
                                          </div>
                                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                              <p className="text-muted-foreground">Start Date</p>
                                              <p>{formatDate(project.startDate, project.contractDate)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Completion Date</p>
                                              <p>{formatDate(project.completionDate, project.targetCompletionDate)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Duration</p>
                                              <p>{project.duration || 'N/A'}</p>
                                            </div>
                                          </div>
                                          
                                          {/* Production Timeline Component */}
                                          <ProductionTimeline project={project} />
                                          
                                          {/* Key Production Dates */}
                                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div>
                                              <p className="text-muted-foreground">Fabrication Start</p>
                                              <p>{formatDate(project.fabricationStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Assembly Start</p>
                                              <p>{formatDate(project.assemblyStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">NTC Testing</p>
                                              <p>{formatDate(project.ntcTesting)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">QC Start</p>
                                              <p>{formatDate(project.qcStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Executive Review</p>
                                              <p>{formatDate(project.executiveReview)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Ship Date</p>
                                              <p>{formatDate(project.ship)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Delivery</p>
                                              <p>{formatDate(project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Location</p>
                                              <p>{project.locationDisplay || project.location}</p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FontAwesomeIcon icon="clipboard-check" className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Completed Projects</h3>
                                    <p className="text-muted-foreground">
                                      There are no completed projects at the moment
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="all" className="space-y-4 pt-4">
                      {isLoadingProjects ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                          <span>Loading projects...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            // Show all projects regardless of status, but apply filters
                            let allProjects = safeFilterProjects(projects, p => {
                              return true; // Include all projects initially
                            });
                            
                            // Apply additional filters from the filter row
                            allProjects = applyFilters(allProjects, allProjectsFilters);
                            
                            return (
                              <>
                                <ProjectFiltersRow 
                                  projects={allProjects} 
                                  onFilterChange={setAllProjectsFilters} 
                                  availableProductionLines={productionLines}
                                />
                                
                                {allProjects.length > 0 ? (
                                  <div className="space-y-4">
                                    {allProjects.map(project => (
                                      <Card 
                                        key={project.id} 
                                        className="cursor-pointer hover:bg-accent/5"
                                        onClick={() => handleOpenProjectDetails(project)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h3 className="font-medium">{project.name}</h3>
                                              <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                                            </div>
                                            <Badge variant="outline">{project.status}</Badge>
                                          </div>
                                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                              <p className="text-muted-foreground">Start Date</p>
                                              <p>{formatDate(project.startDate, project.contractDate)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Target Date</p>
                                              <p>{formatDate(project.targetCompletionDate, project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Progress</p>
                                              <Progress 
                                                value={project.metrics?.completionPercentage ?? project.progress ?? 0} 
                                                className="h-2 mt-1" 
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Production Timeline Component */}
                                          <ProductionTimeline project={project} />
                                          
                                          {/* Key Production Dates */}
                                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div>
                                              <p className="text-muted-foreground">Fabrication Start</p>
                                              <p>{formatDate(project.fabricationStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Assembly Start</p>
                                              <p>{formatDate(project.assemblyStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">NTC Testing</p>
                                              <p>{formatDate(project.ntcTesting)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">QC Start</p>
                                              <p>{formatDate(project.qcStart)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Executive Review</p>
                                              <p>{formatDate(project.executiveReview)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Ship Date</p>
                                              <p>{formatDate(project.ship)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Delivery</p>
                                              <p>{formatDate(project.delivery)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Location</p>
                                              <p>{project.locationDisplay || project.location}</p>
                                            </div>
                                          </div>
                                          
                                          {project.status !== 'COMPLETED' && (
                                            <div className="mt-3 flex justify-end gap-2">
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAssignProject(project);
                                                }}
                                              >
                                                <FontAwesomeIcon icon="sitemap" className="mr-2 h-3 w-3" />
                                                Assign to Line
                                              </Button>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                                    <p className="text-muted-foreground">
                                      No projects match your current filters
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Summary</CardTitle>
                  <CardDescription>Project status overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                      <span>Loading data...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Active Projects</div>
                        <div className="font-medium">{safeFilterProjects(projects, isActiveProject).length}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Planning Stage</div>
                        <div className="font-medium">{safeFilterProjects(projects, isPlanningProject).length}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Completed</div>
                        <div className="font-medium">{safeFilterProjects(projects, isCompletedProject).length}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Delayed</div>
                        <div className="font-medium">{safeFilterProjects(projects, p => {
                          // Use our isActiveProject helper for consistent status checking
                          return isActiveProject(p) && p.isDelayed === true;
                        }).length}</div>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="mt-4">
                        <div className="text-sm text-muted-foreground mb-2">Project Status Distribution</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-2 bg-green-500 rounded" style={{ width: `${(safeFilterProjects(projects, isCompletedProject).length / (projects?.length || 1)) * 100}%` }} />
                          <div className="h-2 bg-blue-500 rounded" style={{ width: `${(safeFilterProjects(projects, isActiveProject).length / (projects?.length || 1)) * 100}%` }} />
                          <div className="h-2 bg-yellow-500 rounded" style={{ width: `${(safeFilterProjects(projects, isPlanningProject).length / (projects?.length || 1)) * 100}%` }} />
                          <div className="h-2 bg-red-500 rounded" style={{ width: `${(safeFilterProjects(projects, p => {
                            if (!p.status) return false;
                            
                            const originalStatus = p.status;
                            const statusLower = typeof originalStatus === 'string' ? originalStatus.toLowerCase() : '';
                            
                            return statusLower === 'on_hold' || statusLower === 'cancelled';
                          }).length / (projects?.length || 1)) * 100}%` }} />
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-xs mt-1">
                          <div className="text-green-500">Completed</div>
                          <div className="text-blue-500">In Progress</div>
                          <div className="text-yellow-500">Planning</div>
                          <div className="text-red-500">On Hold</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                  <CardDescription>Project resource usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Equipment Utilization</div>
                        <div className="text-sm font-medium">78%</div>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Labor Allocation</div>
                        <div className="text-sm font-medium">92%</div>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Material Availability</div>
                        <div className="text-sm font-medium">85%</div>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Production Capacity</div>
                        <div className="text-sm font-medium">65%</div>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <ProductionPlanningDashboard productionLineId={selectedLineId ?? undefined} />
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          {selectedLineId ? (
            <div className="space-y-6">
              <Tabs defaultValue="scheduler" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="scheduler">
                    <FontAwesomeIcon icon="calendar" className="mr-2 h-4 w-4" />
                    Production Scheduler
                  </TabsTrigger>
                  <TabsTrigger value="bays">
                    <FontAwesomeIcon icon="industry" className="mr-2 h-4 w-4" />
                    Bay Assignment
                  </TabsTrigger>
                  <TabsTrigger value="resources">
                    <FontAwesomeIcon icon="users" className="mr-2 h-4 w-4" />
                    Resource Management
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="scheduler">
                  <ProductionScheduler productionLineId={selectedLineId} />
                </TabsContent>
                
                <TabsContent value="bays">
                  <BayScheduler 
                    bays={bays}
                    orders={orders}
                    onAssign={(orderId, bayId) => {
                      console.log(`Assigned order ${orderId} to bay ${bayId}`);
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="resources">
                  <ResourceManagement />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FontAwesomeIcon icon="calendar" className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Production Line</h3>
                <p className="text-muted-foreground">
                  Please select a production line from the overview to view and manage its schedule
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        <TabsContent value="analytics">
          <ProductionAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Project Assignment Dialog */}
      <Dialog open={assignProjectDialogOpen} onOpenChange={setAssignProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Project to Production Line</DialogTitle>
            <DialogDescription>
              Select a production line to assign this project for manufacturing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <h3 className="font-medium">Project Details</h3>
              {selectedProject && (
                <div className="mt-2 space-y-1 text-sm">
                  <p>Name: <span className="font-medium">{selectedProject.name}</span></p>
                  <p>ID: <span className="font-medium">{selectedProject.projectNumber}</span></p>
                  <p>Status: <span className="font-medium">{selectedProject.status}</span></p>
                  <p>Target Date: <span className="font-medium">{formatDate(selectedProject.targetCompletionDate)}</span></p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-1">Production Line</h3>
              <Select value={selectedLineForAssignment || ""} onValueChange={setSelectedLineForAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Production Line" />
                </SelectTrigger>
                <SelectContent>
                  {productionLines.map(line => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name} - {line.status === 'operational' ? 
                        <span className="text-green-500">Available</span> : 
                        <span className="text-amber-500">Limited Capacity</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setAssignProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAssignProject}
              disabled={!selectedLineForAssignment || assignProjectMutation.isPending}
            >
              {assignProjectMutation.isPending ? "Assigning..." : "Assign Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Project Details Dialog */}
      <Dialog open={projectDetailsDialogOpen} onOpenChange={setProjectDetailsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            {selectedProject && (
              <DialogDescription>
                {selectedProject.projectNumber} - {selectedProject.name}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedProject && (
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Project Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Project Number</p>
                        <p className="font-medium">{selectedProject.projectNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={
                          selectedProject.status === 'completed' || selectedProject.status === 'COMPLETED' 
                            ? 'success' 
                            : selectedProject.isDelayed 
                              ? 'destructive' 
                              : 'outline'
                        }>
                          {selectedProject.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p>{formatDate(selectedProject.startDate, selectedProject.contractDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target Completion</p>
                        <p>{formatDate(selectedProject.targetCompletionDate, selectedProject.delivery)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p>{selectedProject.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Team</p>
                        <p>{selectedProject.team || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Progress</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completion: {selectedProject.progress || 0}%</span>
                        <span>Target: 100%</span>
                      </div>
                      <Progress 
                        value={selectedProject.progress} 
                        className="h-2" 
                      />
                      
                      <div className="grid grid-cols-4 gap-2 mt-4 text-sm">
                        <div className="col-span-2">
                          <p className="text-muted-foreground">ME CAD Progress</p>
                          <Progress 
                            value={typeof selectedProject.meCadProgress === 'string' 
                              ? parseFloat(selectedProject.meCadProgress) 
                              : selectedProject.meCadProgress || 0
                            } 
                            className="h-2 mt-1" 
                          />
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">EE Design Progress</p>
                          <Progress 
                            value={typeof selectedProject.eeDesignProgress === 'string' 
                              ? parseFloat(selectedProject.eeDesignProgress) 
                              : selectedProject.eeDesignProgress || 0
                            } 
                            className="h-2 mt-1" 
                          />
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">IT Design Progress</p>
                          <Progress 
                            value={typeof selectedProject.itDesignProgress === 'string' 
                              ? parseFloat(selectedProject.itDesignProgress) 
                              : selectedProject.itDesignProgress || 0
                            } 
                            className="h-2 mt-1" 
                          />
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">NTC Design Progress</p>
                          <Progress 
                            value={typeof selectedProject.ntcDesignProgress === 'string' 
                              ? parseFloat(selectedProject.ntcDesignProgress) 
                              : selectedProject.ntcDesignProgress || 0
                            } 
                            className="h-2 mt-1" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground">Contract Date</p>
                          <p>{formatDate(selectedProject.contractDate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Chassis ETA</p>
                          <p>{formatDate(selectedProject.chassisEta)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fabrication Start</p>
                          <p>{formatDate(selectedProject.fabricationStart)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Assembly Start</p>
                          <p>{formatDate(selectedProject.assemblyStart)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Wrap Graphics</p>
                          <p>{formatDate(selectedProject.wrapGraphics)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">NTC Testing</p>
                          <p>{formatDate(selectedProject.ntcTesting)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">QC Start</p>
                          <p>{formatDate(selectedProject.qcStart)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Executive Review</p>
                          <p>{formatDate(selectedProject.executiveReview)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ship</p>
                          <p>{formatDate(selectedProject.ship)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Delivery</p>
                          <p>{formatDate(selectedProject.delivery)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Personnel</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">ME Assigned</p>
                        <p>{selectedProject.meAssigned || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">EE Assigned</p>
                        <p>{selectedProject.eeAssigned || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">NTC Assigned</p>
                        <p>{selectedProject.ntcAssigned || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <div className="mb-4">
                      <Textarea
                        value={projectNotes}
                        onChange={(e) => setProjectNotes(e.target.value)}
                        placeholder="Add project notes here..."
                        rows={8}
                        className="resize-none"
                      />
                    </div>
                    <Button 
                      onClick={handleUpdateProjectNotes}
                      disabled={isUpdatingNotes}
                      size="sm"
                    >
                      {isUpdatingNotes ? "Saving..." : "Save Notes"}
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Payment Milestones</p>
                        <p>{selectedProject.paymentMilestones || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">LLTs Ordered</p>
                        <p>{selectedProject.lltsOrdered || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">General Notes</p>
                        <p className="whitespace-pre-line">
                          {typeof selectedProject.notes === 'string' 
                            ? selectedProject.notes 
                            : Array.isArray(selectedProject.notes) && selectedProject.notes.length > 0
                              ? selectedProject.notes.map(note => note.content).join('\n')
                              : 'No additional notes'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setProjectDetailsDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleAssignProject(selectedProject as ProductionProject);
                setProjectDetailsDialogOpen(false);
              }}
            >
              Assign to Line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};