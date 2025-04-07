import { useState, useEffect, useCallback, useMemo } from "react";
import { type Project } from "@/types/manufacturing";
import { format, addDays, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { cn } from "@/lib/utils";

// Gantt milestone interface
interface GanttMilestone {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  projectId: string;
  projectName: string;
  editable?: boolean;
  deletable?: boolean;
  dependencies?: string[];
  duration: number; // Duration in days
  indent: number; // Indentation level for hierarchical display
  parent?: string; // Parent milestone ID for hierarchical relationships
  completed: number; // Percentage completed (0-100)
  isExpanded?: boolean; // Whether children are expanded or collapsed
  key?: string; // Key identifier for the milestone type
}

// Define the interface for milestone templates
interface MilestoneTemplate {
  key: string;
  title: string;
  duration: number;
  color: string;
  indent: number;
  parent?: string;
}

// For react-scheduler compatibility
interface ProcessedEvent {
  event_id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource: string | number;
  color?: string;
  editable?: boolean;
  deletable?: boolean;
  project_id?: string;
  [key: string]: any;
}

// For react-scheduler compatibility
interface Resource {
  id: string | number;
  title: string;
  subtitle?: string;
  color?: string;
  avatarSrc?: string | null;
}

// Milestone Edit Dialog props interface
interface MilestoneEditDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  editingMilestone: GanttMilestone | null;
  projectMilestones: GanttMilestone[];
  onSave: (milestone: GanttMilestone) => void;
}

// Extracted MilestoneEditDialog component to prevent React Rules of Hooks errors
const MilestoneEditDialog = ({ 
  showDialog,
  setShowDialog,
  editingMilestone,
  projectMilestones,
  onSave
}: MilestoneEditDialogProps) => {
  // Initialize with default values first, then update conditionally
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState('0');
  const [completion, setCompletion] = useState('0');
  const [parentId, setParentId] = useState('');
  const [indent, setIndent] = useState('0');
  
  // Use useEffect to update state when editingMilestone changes
  useEffect(() => {
    if (!editingMilestone) return;
    
    // Parse the start date safely
    const parseStartDate = () => {
      try {
        if (editingMilestone.start instanceof Date) {
          return format(editingMilestone.start, 'yyyy-MM-dd');
        } else if (typeof editingMilestone.start === 'string') {
          const date = new Date(editingMilestone.start);
          if (!isNaN(date.getTime())) {
            return format(date, 'yyyy-MM-dd');
          }
        }
        // Default to today if date is invalid
        return format(new Date(), 'yyyy-MM-dd');
      } catch (error) {
        console.error("Error parsing start date:", error);
        return format(new Date(), 'yyyy-MM-dd'); // Default to today
      }
    };
    
    setTitle(editingMilestone.title);
    setStartDate(parseStartDate());
    setDuration(editingMilestone.duration?.toString() || '0');
    setCompletion(editingMilestone.completed?.toString() || '0');
    setParentId(editingMilestone.parent || '');
    setIndent(editingMilestone.indent?.toString() || '0');
  }, [editingMilestone]);
  
  const handleSave = () => {
    try {
      // Validate the date input before creating the Date object
      let start: Date;
      try {
        start = new Date(startDate);
        if (isNaN(start.getTime())) {
          // If date is invalid, default to today
          console.error("Invalid start date input:", startDate);
          start = new Date();
        }
      } catch (error) {
        console.error("Error parsing start date:", error);
        start = new Date(); // Default to today
      }
      
      // Safely parse numeric inputs
      const durationValue = parseInt(duration);
      const completionValue = parseInt(completion);
      const indentValue = parseInt(indent);
      
      if (!editingMilestone) return;
      
      const updatedMilestone: GanttMilestone = {
        ...editingMilestone,
        id: editingMilestone.id,
        title: title || "Untitled Milestone",
        start,
        end: addDays(start, !isNaN(durationValue) ? durationValue : 0),
        duration: !isNaN(durationValue) ? durationValue : 0,
        completed: !isNaN(completionValue) ? Math.min(Math.max(completionValue, 0), 100) : 0, // Ensure 0-100 range
        parent: parentId || undefined,
        indent: !isNaN(indentValue) ? Math.max(indentValue, 0) : 0, // Ensure non-negative
        projectId: editingMilestone.projectId,
        projectName: editingMilestone.projectName
      };
      
      onSave(updatedMilestone);
    } catch (error) {
      console.error("Error saving milestone:", error);
      // Create a basic milestone to prevent app from crashing
      if (!editingMilestone) return;
      
      const fallbackMilestone: GanttMilestone = {
        ...editingMilestone,
        title: title || "Untitled Milestone",
        start: new Date(),
        end: addDays(new Date(), 7),
        duration: 7,
        completed: 0,
        parent: parentId || undefined,
        indent: parseInt(indent) || 0,
      };
      onSave(fallbackMilestone);
    }
  };
  
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingMilestone?.id?.includes('new_') ? 'Add Milestone' : 'Edit Milestone'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="completion" className="text-right">Completion %</Label>
            <Input
              id="completion"
              type="number"
              min="0"
              max="100"
              value={completion}
              onChange={(e) => setCompletion(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parent" className="text-right">Parent</Label>
            <Select 
              value={parentId} 
              onValueChange={setParentId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select parent milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent</SelectItem>
                {projectMilestones
                  .filter(m => editingMilestone && m.id !== editingMilestone.id && m.indent === 0)
                  .map(m => {
                    // Extract a key from the milestone ID if no key is present
                    const valueKey = m.key || (m.id.includes('_') ? m.id.split('_').pop() : m.id);
                    return (
                      <SelectItem key={m.id} value={valueKey || m.id}>
                        {m.title}
                      </SelectItem>
                    );
                  })
                }
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="indent" className="text-right">Indent Level</Label>
            <Select 
              value={indent} 
              onValueChange={setIndent}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select indent level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 - Top Level</SelectItem>
                <SelectItem value="1">1 - Child</SelectItem>
                <SelectItem value="2">2 - Grandchild</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Standard milestone definitions based on the provided screenshot
const STANDARD_MILESTONES: MilestoneTemplate[] = [
  { key: "notice", title: "Notice to Proceed", duration: 0, color: "#4f46e5", indent: 0 },
  { key: "projectStart", title: "Project Start", duration: 0, color: "#3B82F6", indent: 0 },
  { key: "mobilization", title: "Mobilization", duration: 10, color: "#EF4444", indent: 0 },
  { key: "mobilize", title: "Mobilize", duration: 16, color: "#EF4444", indent: 1, parent: "mobilization" },
  { key: "construction", title: "Construction", duration: 34, color: "#EC4899", indent: 0 },
  { key: "belowGrade", title: "Below Grade", duration: 13, color: "#8B5CF6", indent: 1, parent: "construction" },
  { key: "gradeSite", title: "Grade Site", duration: 8, color: "#3B82F6", indent: 2, parent: "belowGrade" },
  { key: "setFoundations", title: "Set Foundations", duration: 9, color: "#EF4444", indent: 2, parent: "belowGrade" },
  { key: "installConduit", title: "Install Conduit", duration: 3, color: "#10B981", indent: 2, parent: "belowGrade" },
  { key: "digCableTrench", title: "Dig Cable Trench", duration: 4, color: "#6366F1", indent: 2, parent: "belowGrade" },
  { key: "aboveGrade", title: "Above Grade", duration: 23, color: "#8B5CF6", indent: 1, parent: "construction" },
  { key: "erectSteelStructures", title: "Erect Steel Structures", duration: 8, color: "#3B82F6", indent: 2, parent: "aboveGrade" },
  { key: "installEquipment", title: "Install Equipment", duration: 6, color: "#EF4444", indent: 2, parent: "aboveGrade" },
  { key: "installGrounding", title: "Install Grounding", duration: 2, color: "#10B981", indent: 2, parent: "aboveGrade" },
  { key: "installBusAndJumpers", title: "Install Bus and Jumpers", duration: 8, color: "#6366F1", indent: 2, parent: "aboveGrade" },
  { key: "layControlCable", title: "Lay Control Cable", duration: 12, color: "#EC4899", indent: 2, parent: "aboveGrade" },
  { key: "fence", title: "Fence", duration: 7, color: "#8B5CF6", indent: 1, parent: "construction" },
  { key: "installFence", title: "Install Fence", duration: 7, color: "#3B82F6", indent: 2, parent: "fence" },
  { key: "siteRestoration", title: "Site Restoration", duration: 26, color: "#EF4444", indent: 1, parent: "construction" },
  { key: "removeEquipment", title: "Remove Equipment", duration: 5, color: "#10B981", indent: 2, parent: "siteRestoration" },
  { key: "layStoning", title: "Lay Stoning", duration: 2, color: "#6366F1", indent: 2, parent: "siteRestoration" },
  { key: "layRoadway", title: "Lay Roadway", duration: 4, color: "#EC4899", indent: 2, parent: "siteRestoration" },
  { key: "projectCloseout", title: "Project Closeout", duration: 10, color: "#8B5CF6", indent: 0 },
  { key: "substantialCompletion", title: "Substantial Completion", duration: 18, color: "#EF4444", indent: 1, parent: "projectCloseout" },
  { key: "projectComplete", title: "Project Complete", duration: 0, color: "#10B981", indent: 0 }
];

interface ProjectGanttViewProps {
  projects: Project[];
  onUpdate?: (project: Project, milestones: GanttMilestone[]) => void;
}

export function ProjectGanttView({ projects, onUpdate }: ProjectGanttViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ganttEvents, setGanttEvents] = useState<ProcessedEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the Gantt view component
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMilestones, setProjectMilestones] = useState<GanttMilestone[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<GanttMilestone | null>(null);

  // Get color for project status
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'not_started':
        return '#64748b'; // slate-500
      case 'in_progress':
        return '#3b82f6'; // blue-500
      case 'completed':
        return '#22c55e'; // green-500
      case 'on_hold':
        return '#eab308'; // yellow-500
      case 'cancelled':
        return '#ef4444'; // red-500
      case 'delayed':
        return '#f97316'; // orange-500
      default:
        return '#64748b'; // slate-500
    }
  };

  // Create project resources
  useEffect(() => {
    console.log("Creating Gantt resources for projects:", projects.length);
    
    if (!Array.isArray(projects) || projects.length === 0) {
      setResources([]);
      setLoading(false);
      return;
    }

    try {
      const projectResources: Resource[] = projects.map((project) => ({
        id: project.id,
        title: project.projectNumber || project.name || `Project ${project.id.slice(0, 8)}`,
        subtitle: project.team || '',
        color: getStatusColor(project.status),
        avatarSrc: null,
      }));

      setResources(projectResources);
    } catch (error) {
      console.error("Error creating Gantt resources:", error);
      toast({
        title: "Error",
        description: "Failed to create project resources for Gantt chart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projects, toast]);

  // Toggle milestone expansion state
  const toggleMilestoneExpansion = useCallback((milestoneId: string) => {
    setProjectMilestones(prevMilestones => {
      return prevMilestones.map(m => {
        if (m.id === milestoneId) {
          return { ...m, isExpanded: !m.isExpanded };
        }
        return m;
      });
    });
  }, []);

  // Generate standard milestones for new projects
  const generateStandardMilestones = useCallback((project: Project): GanttMilestone[] => {
    if (!project || !project.id) {
      console.error("Invalid project data provided to generateStandardMilestones");
      return [];
    }
    
    console.log(`Generating standard milestones for project: ${project.projectNumber || project.id}`);
    
    try {
      // Validate the contract date before using it
      let startDate: Date;
      try {
        if (project.contractDate) {
          startDate = new Date(project.contractDate);
          if (isNaN(startDate.getTime())) {
            console.warn(`Invalid contract date for project ${project.id}, using current date instead`);
            startDate = new Date();
          }
        } else {
          startDate = new Date();
        }
      } catch (dateError) {
        console.error(`Error parsing contract date for project ${project.id}:`, dateError);
        startDate = new Date();
      }
        
      // Create a mapping of milestones by key for dependency references
      const milestoneMap: Record<string, GanttMilestone> = {};
      const milestones: GanttMilestone[] = [];
      
      // Make sure STANDARD_MILESTONES exists and is an array
      if (!Array.isArray(STANDARD_MILESTONES) || STANDARD_MILESTONES.length === 0) {
        console.warn("No standard milestones defined, returning empty array");
        return [];
      }
      
      // Create date mapping based on milestone sequence and durations
      // First pass: create all milestones with their initial dates
      let currentDate = new Date(startDate);
      let milestoneStartOffsets: Record<string, number> = {};
      let totalDuration = 0;
      
      // Let's create all milestones first, then establish dependencies
      STANDARD_MILESTONES.forEach((template, index) => {
        const milestoneId = `${project.id}_${template.key}`;
        const milestone: GanttMilestone = {
          id: milestoneId,
          key: template.key,
          title: template.title,
          start: new Date(currentDate),
          end: addDays(currentDate, template.duration),
          color: template.color,
          projectId: project.id,
          projectName: project.projectNumber || project.name || `Project ${project.id.slice(0, 8)}`,
          editable: true,
          deletable: true,
          dependencies: [],
          duration: template.duration,
          indent: template.indent,
          parent: template.parent,
          completed: 0, // New milestones start at 0% completion
          isExpanded: true, // Default to expanded
        };
        
        milestoneMap[template.key] = milestone;
        milestones.push(milestone);
        
        // Record the offset for this milestone
        milestoneStartOffsets[template.key] = totalDuration;
        
        // Only advance the date for top-level milestones or if this is a child that advances time
        if (template.indent === 0) {
          currentDate = addDays(currentDate, template.duration);
          totalDuration += template.duration;
        }
      });
      
      // Second pass: set up parent-child relationships and properly position in timeline
      milestones.forEach(milestone => {
        if (milestone.parent) {
          const parentMilestone = milestoneMap[milestone.parent];
          if (parentMilestone) {
            // Adjust the child milestone's start date to be properly positioned
            // relative to parent's start date
            milestone.start = new Date(parentMilestone.start);
            if (milestone.indent === 2) {
              // If it's a grandchild, find its parent and position after any siblings
              const siblingIndex = milestones.findIndex(m => 
                m.parent === milestone.parent && m.id !== milestone.id && m.indent === milestone.indent
              );
              if (siblingIndex >= 0) {
                const sibling = milestones[siblingIndex];
                milestone.start = new Date(sibling.end);
              }
            }
            milestone.end = addDays(milestone.start, milestone.duration);
            
            // Also add as dependency
            milestone.dependencies = [parentMilestone.id];
          }
        }
      });
      
      return milestones;
    } catch (error) {
      console.error("Error generating standard milestones:", error);
      return []; // Return empty array in case of error
    }
  }, []);

  // Handle milestone selection
  const handleSelectMilestone = useCallback((milestone: GanttMilestone) => {
    setSelectedMilestoneId(milestone.id);
  }, []);

  // Open edit dialog for a milestone
  const handleEditMilestone = useCallback((milestone: GanttMilestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneDialog(true);
  }, []);

  // Handle project selection
  const handleSelectProject = useCallback((project: Project) => {
    try {
      console.log("Selected project:", project.projectNumber || project.name);
      
      setSelectedProject(project);
      
      if (!project.id) {
        console.error("Invalid project ID in handleSelectProject");
        setProjectMilestones([]);
        return;
      }
      
      // First try to fetch existing milestones from the API
      fetch(`/api/manufacturing/projects/${project.id}/milestones`)
        .then(response => {
          if (!response.ok) {
            if (response.status === 404) {
              console.log(`No milestones found for project ${project.id}, generating standard ones`);
              return null;
            }
            throw new Error(`Failed to fetch milestones: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            console.log(`Found ${data.length} existing milestones for project ${project.id}`);
            
            // Convert API milestones to GanttMilestone format
            const existingMilestones: GanttMilestone[] = data.map(m => ({
              id: m.id,
              key: m.key || m.id,
              title: m.title,
              start: new Date(m.start),
              end: new Date(m.end),
              color: m.color || getStatusColor(project.status),
              projectId: project.id,
              projectName: project.projectNumber || project.name || `Project ${project.id.slice(0, 8)}`,
              editable: true,
              deletable: true,
              dependencies: m.dependencies || [],
              duration: m.duration || differenceInDays(new Date(m.end), new Date(m.start)),
              indent: m.indent || 0,
              parent: m.parent,
              completed: m.completed || 0,
              isExpanded: m.isExpanded !== false, // Default to expanded
            }));
            
            setProjectMilestones(existingMilestones);
          } else {
            // No milestones found, generate standard ones
            const generatedMilestones = generateStandardMilestones(project);
            setProjectMilestones(generatedMilestones);
          }
        })
        .catch(error => {
          console.error("Error fetching project milestones:", error);
          console.log("Falling back to generated milestones");
          const generatedMilestones = generateStandardMilestones(project);
          setProjectMilestones(generatedMilestones);
        });
      
    } catch (error) {
      console.error("Error selecting project:", error);
      toast({
        title: "Error",
        description: "Failed to load project milestones",
        variant: "destructive",
      });
      setProjectMilestones([]);
    }
  }, [toast, generateStandardMilestones]);

  // Calculate the total timespan in days for the visualization
  const calculateTotalTimespan = useCallback(() => {
    if (!selectedProject || projectMilestones.length === 0) return 60; // Default to 60 days
    
    try {
      // Find earliest start and latest end date
      const startDates = projectMilestones.map(m => new Date(m.start).getTime());
      const endDates = projectMilestones.map(m => new Date(m.end).getTime());
      
      const earliestStart = Math.min(...startDates);
      const latestEnd = Math.max(...endDates);
      
      // Convert to days and add padding
      const totalDays = Math.ceil((latestEnd - earliestStart) / (1000 * 60 * 60 * 24)) + 14;
      return totalDays > 30 ? totalDays : 30; // Minimum 30 days
    } catch (error) {
      console.error("Error calculating timespan:", error);
      return 60; // Default fallback
    }
  }, [selectedProject, projectMilestones]);

  // Calculate the starting position of a milestone in the graph
  const calculateStartPosition = (milestone: GanttMilestone): number => {
    if (!selectedProject || !projectMilestones || projectMilestones.length === 0) {
      return 0;
    }
    
    try {
      // Find the earliest start date among all milestones
      const startDates = projectMilestones.map(m => new Date(m.start).getTime());
      const earliestStart = Math.min(...startDates);
      
      // Calculate the difference in days between the earliest date and this milestone's start
      const milestoneStart = new Date(milestone.start).getTime();
      const dayDiff = (milestoneStart - earliestStart) / (1000 * 60 * 60 * 24);
      
      // Calculate percentage based on total timespan
      const totalDays = calculateTotalTimespan();
      return (dayDiff / totalDays) * 100;
    } catch (error) {
      console.error("Error calculating start position:", error);
      return 0;
    }
  };

  // Calculate the width of a milestone bar based on its duration
  const calculateBarWidth = (milestone: GanttMilestone): number => {
    try {
      const totalDays = calculateTotalTimespan();
      const durationDays = milestone.duration;
      return (durationDays / totalDays) * 100;
    } catch (error) {
      console.error("Error calculating bar width:", error);
      return 2; // Default minimum width
    }
  };

  // Function to draw connector lines between related milestones
  const renderConnectorLines = (milestone: GanttMilestone) => {
    if (!milestone.dependencies || milestone.dependencies.length === 0) return null;

    return milestone.dependencies.map(depId => {
      const dependencyMilestone = projectMilestones.find(m => m.id === depId || m.key === depId);
      
      if (!dependencyMilestone) return null;
      
      const startX = calculateStartPosition(dependencyMilestone) + calculateBarWidth(dependencyMilestone);
      const endX = calculateStartPosition(milestone);
      const startY = 50; // Middle of the bar
      const endY = 50;
            
      // Only draw if dependency is before the milestone
      if (startX > endX) return null;
      
      return (
        <svg 
          key={`connector-${depId}-${milestone.id}`}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <defs>
            <marker
              id={`arrowhead-${depId}-${milestone.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
          <path 
            d={`M ${startX}% ${startY}% H ${startX + (endX - startX) / 2}% V ${endY}% H ${endX}%`}
            stroke="#64748b"
            strokeWidth="1"
            fill="none"
            strokeDasharray="4 2"
            markerEnd={`url(#arrowhead-${depId}-${milestone.id})`}
          />
        </svg>
      );
    });
  };

  // Create a new milestone
  const handleAddMilestone = () => {
    if (!selectedProject) return;
    
    // Create a new milestone with defaults
    const newId = `new_${Date.now()}`;
    const newMilestone: GanttMilestone = {
      id: newId,
      title: "New Milestone",
      start: new Date(),
      end: addDays(new Date(), 7),
      duration: 7,
      projectId: selectedProject.id,
      projectName: selectedProject.projectNumber || "",
      color: "#3B82F6",
      editable: true,
      deletable: true,
      dependencies: [],
      indent: 0,
      completed: 0,
      isExpanded: true,
    };
    
    setEditingMilestone(newMilestone);
    setShowMilestoneDialog(true);
  };

  // Save milestone changes
  const handleSaveMilestone = (milestone: GanttMilestone) => {
    if (!selectedProject) return;
    
    // Show loading toast
    toast({
      title: "Saving...",
      description: "Updating project milestone",
    });
    
    // Format the milestone data for API
    const milestoneData = {
      id: milestone.id.startsWith('new_') ? undefined : milestone.id,
      title: milestone.title,
      start: milestone.start.toISOString(),
      end: milestone.end.toISOString(),
      color: milestone.color,
      projectId: selectedProject.id,
      duration: milestone.duration,
      dependencies: milestone.dependencies || [],
      indent: milestone.indent,
      parent: milestone.parent === "none" ? null : milestone.parent,
      completed: milestone.completed,
      key: milestone.key,
      isExpanded: milestone.isExpanded,
    };
    
    // Determine if this is a create or update operation
    const isNew = milestone.id.startsWith('new_');
    const method = isNew ? 'POST' : 'PUT';
    const endpoint = isNew 
      ? `/api/manufacturing/projects/${selectedProject.id}/milestones`
      : `/api/manufacturing/projects/${selectedProject.id}/milestones/${milestone.id}`;
    
    // Call API to save the milestone
    fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(milestoneData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to save milestone: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(savedMilestone => {
        // Success! Update local state with the saved milestone
        console.log("Milestone saved successfully:", savedMilestone);
        
        // Generate a proper ID for new milestones if needed
        let updatedMilestone = milestone;
        if (isNew) {
          // Use the ID returned from the API if available, otherwise generate one
          const newId = savedMilestone?.id || `${selectedProject.id}_milestone_${Date.now()}`;
          updatedMilestone = { ...milestone, id: newId };
        }
        
        // Update milestone list state based on operation type
        if (isNew) {
          setProjectMilestones(prev => [...prev, updatedMilestone]);
        } else {
          setProjectMilestones(prev => 
            prev.map(m => m.id === milestone.id ? updatedMilestone : m)
          );
        }
        
        // Show success toast
        toast({
          title: "Success",
          description: `Milestone ${isNew ? 'created' : 'updated'} successfully`,
        });
        
        // Close dialog and reset selection
        setShowMilestoneDialog(false);
        setSelectedMilestoneId(null);
        
        // Notify parent if callback is provided
        if (onUpdate && selectedProject) {
          const updatedMilestones = isNew
            ? [...projectMilestones, updatedMilestone]
            : projectMilestones.map(m => m.id === milestone.id ? updatedMilestone : m);
          onUpdate(selectedProject, updatedMilestones);
        }
      })
      .catch(error => {
        console.error("Error saving milestone:", error);
        
        // Show error toast
        toast({
          title: "Error",
          description: `Failed to save milestone: ${error.message}`,
          variant: "destructive",
        });
        
        // Fall back to local state update if API fails
        // This ensures UI consistency even if the backend storage fails
        if (isNew) {
          const newId = `${selectedProject.id}_milestone_${Date.now()}`;
          const localMilestone = { ...milestone, id: newId };
          setProjectMilestones(prev => [...prev, localMilestone]);
        } else {
          setProjectMilestones(prev => 
            prev.map(m => m.id === milestone.id ? milestone : m)
          );
        }
        
        // Close dialog but don't reset selection in case user wants to retry
        setShowMilestoneDialog(false);
      });
  };

  // Delete a milestone
  const handleDeleteMilestone = (milestoneId: string) => {
    if (!selectedProject || !milestoneId) return;
    
    // Show a loading toast
    toast({
      title: "Deleting...",
      description: "Removing milestone",
    });
    
    // Call the API to delete the milestone
    fetch(`/api/manufacturing/projects/${selectedProject.id}/milestones/${milestoneId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) {
          // Handle specific errors like 404 (not found)
          if (response.status === 404) {
            console.warn(`Milestone ${milestoneId} not found on server, removing from UI only`);
            return { success: true, message: "Milestone not found on server but removed from UI" };
          }
          throw new Error(`Failed to delete milestone: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Milestone deleted successfully:", data);
        
        // Update milestone list in state by filtering out the deleted one
        setProjectMilestones(prev => prev.filter(m => m.id !== milestoneId));
        
        // Show success toast
        toast({
          title: "Success",
          description: "Milestone deleted successfully",
        });
        
        // Clear selected milestone since it no longer exists
        setSelectedMilestoneId(null);
        
        // Notify parent if callback is provided
        if (onUpdate && selectedProject) {
          onUpdate(selectedProject, projectMilestones.filter(m => m.id !== milestoneId));
        }
      })
      .catch(error => {
        console.error("Error deleting milestone:", error);
        
        // Show error toast
        toast({
          title: "Error",
          description: `Failed to delete milestone: ${error.message}`,
          variant: "destructive",
        });
        
        // We could choose to still remove it from the UI for consistency
        // but in this case we'll only remove it if the API call succeeds
        // to maintain data integrity
      });
  };

  // Generate timeline headers (days)
  const renderTimelineHeaders = useMemo(() => {
    // If no project is selected, show empty state
    if (!selectedProject || projectMilestones.length === 0) {
      return (
        <div className="flex">
          {Array.from({ length: 30 }).map((_, i) => {
            const currentDate = addDays(new Date(), i);
            return (
              <div key={`day-${i}`} className="day-column">
                <div className="day-header text-center text-xs font-semibold">
                  {i === 0 || currentDate.getDate() === 1 ? (
                    <span className="month">
                      {format(currentDate, 'MMM')}
                    </span>
                  ) : null}
                  <span className="day">
                    {format(currentDate, 'd')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Find earliest start date to anchor the timeline
    try {
      const startDates = projectMilestones.map(m => new Date(m.start).getTime());
      const earliestDate = new Date(Math.min(...startDates));
      const totalDays = calculateTotalTimespan();
      
      // Return timeline for actual project dates
      return (
        <div className="flex">
          {Array.from({ length: totalDays }).map((_, i) => {
            const currentDate = addDays(earliestDate, i);
            return (
              <div key={`day-${i}`} className="day-column">
                <div className="day-header text-center text-xs font-semibold">
                  {i === 0 || currentDate.getDate() === 1 ? (
                    <span className="month">
                      {format(currentDate, 'MMM')}
                    </span>
                  ) : null}
                  <span className="day">
                    {format(currentDate, 'd')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error("Error rendering timeline headers:", error);
      // Fallback to empty timeline
      return <div className="flex"></div>;
    }
  }, [selectedProject, projectMilestones, calculateTotalTimespan]);

  return (
    <div className="gantt-chart-container space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddMilestone}
            disabled={!selectedProject}
          >
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (selectedMilestoneId && selectedProject) {
                const milestone = projectMilestones.find(m => m.id === selectedMilestoneId);
                if (milestone) handleEditMilestone(milestone);
              }
            }}
            disabled={!selectedMilestoneId}
          >
            <FontAwesomeIcon icon="pencil-alt" className="mr-2 h-4 w-4" />
            Edit Selected
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (selectedMilestoneId) handleDeleteMilestone(selectedMilestoneId);
            }}
            disabled={!selectedMilestoneId}
          >
            <FontAwesomeIcon icon="trash" className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
        <Select 
          value={selectedProject?.id || ''} 
          onValueChange={(id) => {
            const project = projects.find(p => p.id === id);
            if (project) handleSelectProject(project);
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.projectNumber || project.name || `Project ${project.id.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProject ? (
        <div className="gantt-view border rounded-md" style={{ height: "calc(100vh - 240px)", overflow: "hidden" }}>
          {/* Fixed header with horizontal scrolling */}
          <div className="gantt-timeline-header sticky top-0 z-10 bg-background border-b" style={{ overflow: "hidden" }}>
            <div className="flex">
              <div className="w-64 min-w-64 p-2 font-medium border-r sticky left-0 bg-background">Milestone</div>
              <div className="flex-1 overflow-x-auto" style={{ minWidth: "750px" }}>
                {renderTimelineHeaders}
              </div>
            </div>
          </div>
          
          {/* Gantt body with both horizontal and vertical scrolling */}
          <div className="gantt-body" style={{ height: "calc(100% - 70px)", overflowY: "auto", overflowX: "auto" }}>
            {projectMilestones.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No milestones for this project. Use "Add Milestone" to create some.
              </div>
            ) : (
              <div style={{ minWidth: "850px" }}>
                {projectMilestones.map(milestone => {
                  // Check if milestone should be visible based on parent's expanded state
                  if (milestone.parent) {
                    const parent = projectMilestones.find(m => m.id === milestone.parent);
                    if (parent && !parent.isExpanded) {
                      return null; // Skip this milestone if parent is collapsed
                    }
                  }
                  
                  return (
                    <div 
                      key={milestone.id} 
                      className={cn(
                        "gantt-row flex border-b hover:bg-muted/30 transition-colors",
                        selectedMilestoneId === milestone.id ? "bg-muted" : ""
                      )}
                    >
                      <div 
                        className="w-64 min-w-64 p-2 gantt-milestone-name flex items-center cursor-pointer sticky left-0 bg-background z-10"
                        onClick={() => handleSelectMilestone(milestone)}
                      >
                        <div 
                          className="flex items-center" 
                          style={{ 
                            marginLeft: `${milestone.indent * 16}px` 
                          }}
                        >
                          {/* Expand/collapse toggle for parent milestones */}
                          {projectMilestones.some(m => m.parent === milestone.id) && (
                            <div className="mr-2">
                              {milestone.isExpanded ? (
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMilestoneExpansion(milestone.id);
                                }}>
                                  <FontAwesomeIcon icon="chevron-down" className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMilestoneExpansion(milestone.id);
                                }}>
                                  <FontAwesomeIcon icon="chevron-right" className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          <div
                            className="h-3 w-3 rounded-full mr-2"
                            style={{ backgroundColor: milestone.color || "#3B82F6" }}
                          ></div>
                          <div 
                            className="milestone-title truncate"
                          >
                            {milestone.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 relative p-2" style={{ minHeight: "40px" }}>
                        <div className="gantt-timeline-grid relative h-full">
                          {/* Milestone bar */}
                          <div
                            className="absolute h-6 rounded-sm cursor-pointer border border-gray-400 shadow-sm hover:brightness-95 transition-all"
                            style={{
                              left: `${calculateStartPosition(milestone)}%`,
                              width: `${calculateBarWidth(milestone)}%`,
                              backgroundColor: milestone.color || "#3B82F6",
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 20
                            }}
                            onClick={() => handleEditMilestone(milestone)}
                          >
                            {/* Completion indicator */}
                            {milestone.completed > 0 && (
                              <div
                                className="absolute h-full opacity-60 bg-white"
                                style={{
                                  width: `${milestone.completed}%`,
                                }}
                              ></div>
                            )}
                            
                            {/* Duration large enough to show text inside */}
                            {milestone.duration >= 3 && (
                              <div className="px-2 text-white text-xs truncate whitespace-nowrap">
                                {milestone.title} ({milestone.completed}%)
                              </div>
                            )}
                          </div>
                          
                          {/* Connector lines for dependencies */}
                          {renderConnectorLines(milestone)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="gantt-footer p-2 border-t flex justify-between items-center text-xs text-muted-foreground sticky bottom-0 bg-background">
            <div>
              Project: {selectedProject.projectNumber || selectedProject.name}
            </div>
            <div className="flex items-center space-x-4">
              <div>Start: {selectedProject.contractDate ? format(new Date(selectedProject.contractDate), 'MM/dd/yyyy') : 'Not set'}</div>
              <div>Duration: {calculateTotalTimespan()} days</div>
              <div>Milestones: {projectMilestones.length}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center bg-muted/30">
          <div className="mb-4">
            <FontAwesomeIcon icon="project-diagram" className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">Select a Project</h3>
          <p className="text-muted-foreground mb-4">
            Please select a project from the dropdown to view its Gantt chart.
          </p>
          {projects.length === 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">No projects available. Create a project first.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Milestone Edit Dialog */}
      <MilestoneEditDialog
        showDialog={showMilestoneDialog}
        setShowDialog={setShowMilestoneDialog}
        editingMilestone={editingMilestone}
        projectMilestones={projectMilestones}
        onSave={handleSaveMilestone}
      />
    </div>
  );
}