import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Scheduler } from "@aldabil/react-scheduler";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Project } from "@/types/manufacturing";
import { 
  format, 
  addWeeks, 
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  parse, 
  isSameDay 
} from "date-fns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes, 
  faLink, 
  faChevronRight, 
  faChevronDown, 
  faProjectDiagram 
} from "@fortawesome/pro-light-svg-icons";

// Import types from ProjectGanttTypes
import {
  GanttMilestone,
  ProcessedEvent,
  Resource,
  MilestoneTemplate,
  MilestoneEditDialogProps,
  DragState,
  ProjectGanttViewProps
} from './ProjectGanttTypes';

// Import GanttDependencyArrows component
import GanttDependencyArrows from './GanttDependencyArrows';

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
                <SelectItem value="">No Parent</SelectItem>
                {projectMilestones
                  .filter(m => editingMilestone && m.id !== editingMilestone.id && m.indent === 0)
                  .map(m => {
                    // Extract a key from the milestone ID if no key is present
                    const valueKey = m.key || (m.id.includes('_') ? m.id.split('_').pop() : m.id);
                    return (
                      <SelectItem key={m.id} value={valueKey || ''}>
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

// GanttDependencyArrows component removed to fix Error 310

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

// ProjectGanttViewProps is now imported from ProjectGanttTypes.ts

export function ProjectGanttView({ projects, onUpdate }: ProjectGanttViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ganttEvents, setGanttEvents] = useState<ProcessedEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Time scale options
  const timeScaleOptions = [
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: '6-months', label: '6 Months' },
    { value: 'year', label: 'Year' }
  ];
  const [timeScale, setTimeScale] = useState<string>('days');
  
  // All Projects view
  const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
  
  // Ref for the gantt chart container (used for positioning dependency arrows)
  const ganttChartContainerRef = useRef<HTMLDivElement>(null);

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

  // Generate standard milestones for new projects
  const generateStandardMilestones = (project: Project): GanttMilestone[] => {
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
      
      // Use traditional for loop instead of forEach for better error handling
      for (let i = 0; i < STANDARD_MILESTONES.length; i++) {
        try {
          const milestoneTemplate = STANDARD_MILESTONES[i];
          
          // Validate milestone template data
          if (!milestoneTemplate || typeof milestoneTemplate !== 'object') {
            console.warn(`Invalid milestone template at index ${i}, skipping`);
            continue; // Skip this iteration
          }
          
          // Safety check for required properties
          if (!milestoneTemplate.key || typeof milestoneTemplate.key !== 'string') {
            console.warn(`Milestone template at index ${i} missing valid key, skipping`);
            continue;
          }
          
          if (!milestoneTemplate.title || typeof milestoneTemplate.title !== 'string') {
            console.warn(`Milestone template with key ${milestoneTemplate.key} missing valid title, using default`);
            milestoneTemplate.title = `Milestone ${i + 1}`;
          }
          
          // Create dates
          let start = new Date(currentDate);
          if (isNaN(start.getTime())) {
            console.warn(`Invalid start date created for milestone ${milestoneTemplate.key}, using current date`);
            start = new Date();
          }
          
          // Ensure duration is valid
          const duration = typeof milestoneTemplate.duration === 'number' ? 
            Math.max(0, milestoneTemplate.duration) : 0;
          
          // Calculate end date
          let end: Date;
          try {
            end = duration > 0 ? addDays(start, duration) : new Date(start);
            if (isNaN(end.getTime())) {
              console.warn(`Invalid end date calculated for milestone ${milestoneTemplate.key}, using start date`);
              end = new Date(start);
            }
          } catch (dateError) {
            console.error(`Error calculating end date for milestone ${milestoneTemplate.key}:`, dateError);
            end = new Date(start); // Fallback to start date
          }
            
          // Safe ID generation, ensure project.id and milestoneTemplate.key are valid strings
          const safeProjectId = String(project.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
          const safeMilestoneKey = String(milestoneTemplate.key || '').replace(/[^a-zA-Z0-9_-]/g, '');
          const id = `${safeProjectId}_${safeMilestoneKey}`;
          
          const milestone: GanttMilestone = {
            id,
            title: milestoneTemplate.title,
            start,
            end,
            color: milestoneTemplate.color || "#3B82F6",
            projectId: project.id,
            projectName: project.projectNumber || project.name || `Project ${String(project.id || '').slice(0, 8)}`,
            editable: true,
            deletable: true,
            key: milestoneTemplate.key, // Store the key for dependency reference
            duration,
            indent: typeof milestoneTemplate.indent === 'number' ? Math.max(0, milestoneTemplate.indent) : 0,
            parent: milestoneTemplate.parent,
            isExpanded: true,
            completed: 0 // Default to 0% completion
          };
          
          milestones.push(milestone);
          milestoneMap[milestoneTemplate.key] = milestone;
          
          // Only advance the current date for parent milestones or standalone milestones
          if (!milestoneTemplate.parent && duration > 0) {
            currentDate = end;
          }
        } catch (milestoneError) {
          console.error(`Error creating milestone at index ${i}:`, milestoneError);
          // Continue with the next milestone
        }
      }
      
      // Second pass: adjust child milestone dates based on parent start dates
      for (let i = 0; i < milestones.length; i++) {
        try {
          const milestone = milestones[i];
          
          if (!milestone || !milestone.parent) {
            continue; // Skip non-child milestones
          }
          
          const parentKey = milestone.parent;
          if (!parentKey || typeof parentKey !== 'string') {
            console.warn(`Milestone ${milestone.id} has invalid parent reference, skipping parent adjustment`);
            continue;
          }
          
          const parent = milestoneMap[parentKey];
          if (!parent) {
            console.warn(`Parent milestone with key "${parentKey}" not found for child ${milestone.id}`);
            continue;
          }
          
          // Ensure parent has valid start date
          if (!parent.start || !(parent.start instanceof Date) || isNaN(parent.start.getTime())) {
            console.warn(`Parent milestone "${parentKey}" has invalid start date, skipping child adjustment`);
            continue;
          }
          
          // Child starts when parent starts
          milestone.start = new Date(parent.start);
          
          // Calculate end date based on duration
          try {
            const duration = milestone.duration || 0;
            milestone.end = addDays(milestone.start, duration);
            
            // Validate the calculated end date
            if (!(milestone.end instanceof Date) || isNaN(milestone.end.getTime())) {
              console.warn(`Invalid end date calculated for child milestone ${milestone.id}, using start date + 1 day`);
              milestone.end = addDays(milestone.start, 1);
            }
          } catch (endDateError) {
            console.error(`Error calculating end date for child milestone ${milestone.id}:`, endDateError);
            milestone.end = addDays(milestone.start, 1); // Fallback to 1 day duration
          }
        } catch (childError) {
          console.error(`Error adjusting child milestone at index ${i}:`, childError);
          // Continue with the next milestone
        }
      }
      
      return milestones;
    } catch (error) {
      console.error(`Error generating standard milestones for project ${project.id}:`, error);
      return [];
    }
  };

  // Convert project data to Gantt chart events
  useEffect(() => {
    console.log("Converting projects to Gantt events");
    
    if (!Array.isArray(projects) || projects.length === 0) {
      setGanttEvents([]);
      return;
    }

    try {
      let allEvents: ProcessedEvent[] = [];

      projects.forEach(project => {
        // Use existing milestones or generate standard ones
        // In a real implementation, you would fetch saved milestones from the backend
        // For this implementation, we'll generate standard ones
        const milestones = generateStandardMilestones(project);
        
        const projectEvents = milestones.map(milestone => ({
          event_id: milestone.id,
          title: milestone.title,
          start: milestone.start,
          end: milestone.end,
          resource: project.id,
          color: milestone.color,
          editable: true,
          deletable: true,
          project_id: project.id,
          duration: milestone.duration,
          indent: milestone.indent,
          completed: milestone.completed
        }));
        
        allEvents = [...allEvents, ...projectEvents];
      });

      setGanttEvents(allEvents);
    } catch (error) {
      console.error("Error converting projects to Gantt events:", error);
      toast({
        title: "Error",
        description: "Failed to create Gantt chart events",
        variant: "destructive",
      });
    }
  }, [projects, toast]);

  // Mutation for updating milestones on the server
  const updateMilestonesMutation = useMutation({
    mutationFn: async ({ projectId, milestones }: { projectId: string, milestones: GanttMilestone[] }) => {
      console.log(`Updating milestones for project ${projectId}:`, milestones);
      
      const response = await fetch(`/api/manufacturing/projects/${projectId}/milestones`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ milestones }),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestones');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      toast({
        title: "Success",
        description: "Project milestones updated"
      });
    },
    onError: (error) => {
      console.error("Error updating milestones:", error);
      toast({
        title: "Error",
        description: "Failed to update project milestones",
        variant: "destructive"
      });
    }
  });

  // Event handlers for the Gantt chart
  const handleEventUpdate = async (event: ProcessedEvent) => {
    console.log("Handling event update:", event);
    
    try {
      // Find the project that owns this milestone
      const projectId = event.resource.toString();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        throw new Error(`Project not found for ID: ${projectId}`);
      }
      
      // Get all events for this project
      const projectEvents = ganttEvents.filter(e => e.resource === projectId);
      
      // Update the changed event
      const updatedEvents = projectEvents.map(e => 
        e.event_id === event.event_id ? event : e
      );
      
      // Convert to milestones format
      const milestones: GanttMilestone[] = updatedEvents.map(e => ({
        id: e.event_id.toString(),
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        color: e.color?.toString(),
        projectId: projectId,
        projectName: project.projectNumber || project.name || '',
        editable: true,
        deletable: true,
        duration: typeof e.duration === 'number' ? e.duration : 
          differenceInCalendarDays(new Date(e.end), new Date(e.start)) || 1,
        indent: typeof e.indent === 'number' ? e.indent : 0,
        completed: typeof e.completed === 'number' ? e.completed : 0
      }));
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate(project, milestones);
      }
      
      // Update milestones on the server
      // In a real implementation, you would save these to the backend
      // updateMilestonesMutation.mutate({ projectId, milestones });
      
      // For now, just return the event to update the UI
      return event;
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleEventAdd = async (event: ProcessedEvent) => {
    console.log("Handling event add:", event);
    
    try {
      // Generate a unique ID for the new event
      const newEventId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newEvent = {
        ...event,
        event_id: newEventId
      };
      
      // Add to local state
      setGanttEvents(prev => [...prev, newEvent]);
      
      // In a real implementation, you would save this to the backend
      // For now, just return the event to update the UI
      return newEvent;
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Error",
        description: "Failed to add milestone",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleEventDelete = async (eventId: string) => {
    console.log("Handling event delete:", eventId);
    
    try {
      // Remove from local state
      setGanttEvents(prev => prev.filter(e => e.event_id !== eventId));
      
      // In a real implementation, you would delete this from the backend
      return eventId;
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive"
      });
      return null;
    }
  };

  // Helper function to get color based on project status
  function getStatusColor(status: string): string {
    switch (status) {
      case "NOT_STARTED":
        return "#6B7280"; // gray-500
      case "IN_FAB":
        return "#3B82F6"; // blue-500
      case "IN_ASSEMBLY":
        return "#6366F1"; // indigo-500
      case "IN_WRAP":
        return "#A855F7"; // purple-500
      case "IN_NTC_TESTING":
        return "#F97316"; // orange-500
      case "IN_QC":
        return "#EAB308"; // yellow-500
      case "COMPLETED":
        return "#22C55E"; // green-500
      default:
        return "#6B7280"; // gray-500
    }
  }

  // States for milestone editing
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMilestones, setProjectMilestones] = useState<GanttMilestone[]>([]);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<GanttMilestone | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No projects available to display in the Gantt chart.</p>
          <Button className="mt-4">
            <FontAwesomeIcon icon="plus" className="mr-2" />
            Create Project
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Define all functions after all hooks
  const toggleMilestoneExpansion = useCallback((milestoneId: string) => {
    setProjectMilestones(prev => 
      prev.map(m => m.id === milestoneId ? {...m, isExpanded: !m.isExpanded} : m)
    );
  }, [setProjectMilestones]);
  
  const handleSelectMilestone = useCallback((milestone: GanttMilestone) => {
    setSelectedMilestoneId(milestone.id);
  }, [setSelectedMilestoneId]);
  
  const handleEditMilestone = useCallback((milestone: GanttMilestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneDialog(true);
  }, [setEditingMilestone, setShowMilestoneDialog]);
  
  // Function to select a project and load its milestones
  const handleSelectProject = useCallback((project: Project) => {
    if (!project || !project.id) {
      console.error("Invalid project selected");
      toast({
        title: "Error",
        description: "Could not load project details",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSelectedProject(project);
      
      // Generate or load milestones for the selected project
      const milestones = generateStandardMilestones(project);
      
      // Validate the generated milestones before setting state
      if (!Array.isArray(milestones)) {
        console.error("Generated milestones is not an array");
        setProjectMilestones([]);
        return;
      }
      
      // Filter out any invalid milestones
      const validMilestones = milestones.filter(m => 
        m && m.id && m.title && 
        m.start instanceof Date && !isNaN(m.start.getTime()) &&
        m.end instanceof Date && !isNaN(m.end.getTime())
      );
      
      console.log(`Generated ${validMilestones.length} valid milestones for project ${project.projectNumber || project.id}`);
      setProjectMilestones(validMilestones);
    } catch (error) {
      console.error("Error selecting project:", error);
      toast({
        title: "Error",
        description: "Failed to load project milestones",
        variant: "destructive"
      });
      setProjectMilestones([]);
    }
  }, [toast, generateStandardMilestones, setSelectedProject, setProjectMilestones]);
  
  // Calculate number of days for the Gantt chart timeline
  const calculateTotalDays = (): number => {
    if (!selectedProject || projectMilestones.length === 0) return 60; // Default to 60 days
    
    // Get the earliest start date and latest end date
    const startDates = projectMilestones.map(m => new Date(m.start).getTime());
    const endDates = projectMilestones.map(m => new Date(m.end).getTime());
    
    const earliestStart = new Date(Math.min(...startDates));
    const latestEnd = new Date(Math.max(...endDates));
    
    // Add padding of 5 days on each side
    const paddedStart = new Date(earliestStart);
    paddedStart.setDate(paddedStart.getDate() - 5);
    
    const paddedEnd = new Date(latestEnd);
    paddedEnd.setDate(paddedEnd.getDate() + 5);
    
    // Return the number of days between the earliest start and latest end
    return differenceInCalendarDays(paddedEnd, paddedStart) + 1;
  };
  
  // Generate the timeline header with dates based on selected time scale
  const generateTimelineHeader = () => {
    // Return empty array if no project or milestones
    if (!selectedProject || !projectMilestones || projectMilestones.length === 0) {
      console.log("No project or milestones selected for timeline header");
      return [];
    }
    
    try {
      // Get valid milestones with proper start dates
      const validMilestones = projectMilestones.filter(m => 
        m && m.start && 
        ((m.start instanceof Date && !isNaN(m.start.getTime())) || 
         (typeof m.start === 'string' && !isNaN(new Date(m.start).getTime())))
      );
      
      if (validMilestones.length === 0) {
        console.warn("No valid milestone dates found for timeline header");
        
        // If no valid milestones, generate a default timeline based on the selected time scale
        const defaultStartDate = new Date();
        const dayElements = [];
        
        // Determine units based on time scale
        let units = 60; // Default: 60 days
        let unitLabel = 'day';
        let unitType: 'day' | 'week' | 'month' | 'halfYear' | 'year' = 'day';
        
        switch (timeScale) {
          case 'days':
            units = 60; // 60 days
            unitLabel = 'day';
            unitType = 'day';
            break;
          case 'weeks':
            units = 12; // 12 weeks
            unitLabel = 'week';
            unitType = 'week';
            break;
          case 'months':
            units = 6; // 6 months
            unitLabel = 'month';
            unitType = 'month';
            break;
          case '6-months':
            units = 2; // 2 half-years
            unitLabel = 'half-year';
            unitType = 'halfYear';
            break;
          case 'year':
            units = 1; // 1 year
            unitLabel = 'year';
            unitType = 'year';
            break;
        }
        
        for (let i = 0; i < units; i++) {
          const currentDate = new Date(defaultStartDate);
          
          // Adjust date based on time scale
          switch (unitType) {
            case 'day':
              currentDate.setDate(currentDate.getDate() + i);
              break;
            case 'week':
              currentDate.setDate(currentDate.getDate() + (i * 7));
              break;
            case 'month':
              currentDate.setMonth(currentDate.getMonth() + i);
              break;
            case 'halfYear':
              currentDate.setMonth(currentDate.getMonth() + (i * 6));
              break;
            case 'year':
              currentDate.setFullYear(currentDate.getFullYear() + i);
              break;
          }
          
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          const isFirstOfMonth = currentDate.getDate() === 1;
          const isMonday = currentDate.getDay() === 1;
          
          let headerWidth = 20; // Default: 20px per day
          
          // Calculate header width based on time scale
          switch (timeScale) {
            case 'days':
              headerWidth = 20; // 20px per day
              break;
            case 'weeks':
              headerWidth = 100; // 100px per week
              break;
            case 'months':
              headerWidth = 300; // 300px per month
              break;
            case '6-months':
              headerWidth = 600; // 600px per half-year
              break;
            case 'year':
              headerWidth = 1200; // 1200px per year
              break;
          }
          
          let formatString = 'd';
          
          // Use appropriate date format based on time scale
          switch (timeScale) {
            case 'days':
              formatString = 'd';
              break;
            case 'weeks':
              formatString = 'MMM d';
              break;
            case 'months':
              formatString = 'MMM yyyy';
              break;
            case '6-months':
              formatString = timeScale === '6-months' ? 
                `${currentDate.getMonth() < 6 ? 'H1' : 'H2'} yyyy` : 
                'yyyy';
              break;
            case 'year':
              formatString = 'yyyy';
              break;
          }
          
          dayElements.push(
            <div 
              key={`default-${unitLabel}-${i}`} 
              className="gantt-timeline-day" 
              style={{ 
                flex: `0 0 ${headerWidth}px`,
                width: `${headerWidth}px`,
                backgroundColor: isWeekend && unitType === 'day' ? '#f8f8f8' : 'white',
                borderRight: isFirstOfMonth ? '2px solid #d0d0d0' : '1px solid #e0e0e0'
              }}
            >
              <div className="gantt-timeline-day-number">
                {unitType === 'day' ? currentDate.getDate() : 
                 unitType === 'week' ? `W${Math.ceil((currentDate.getDate() + 
                   new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}` :
                 unitType === 'month' ? format(currentDate, 'MMM') :
                 unitType === 'halfYear' ? (currentDate.getMonth() < 6 ? 'H1' : 'H2') :
                 format(currentDate, 'yyyy')}
              </div>
              {(isFirstOfMonth || isMonday || unitType !== 'day') && (
                <div className="gantt-timeline-day-month">
                  {unitType === 'day' ? format(currentDate, 'MMM') :
                   unitType === 'week' ? format(currentDate, 'MMM yyyy') :
                   unitType === 'month' ? format(currentDate, 'yyyy') :
                   unitType === 'halfYear' ? format(currentDate, 'yyyy') :
                   ''}
                </div>
              )}
            </div>
          );
        }
        
        return dayElements;
      }
      
      // Get the earliest milestone start date
      const startDates = validMilestones.map(m => 
        m.start instanceof Date ? m.start.getTime() : new Date(m.start).getTime()
      );
      
      // Find the minimum valid date
      const earliestDate = new Date(Math.min(...startDates));
      if (isNaN(earliestDate.getTime())) {
        console.error("Failed to calculate earliest date from milestone start dates");
        return []; // Return empty array if calculation fails
      }
      
      // Create a start date before the earliest milestone, adjusted based on time scale
      const startDate = new Date(earliestDate);
      
      // Adjust padding based on time scale
      switch (timeScale) {
        case 'days':
          startDate.setDate(startDate.getDate() - 5); // 5 days padding
          break;
        case 'weeks':
          startDate.setDate(startDate.getDate() - 7); // 1 week padding
          break;
        case 'months':
          startDate.setMonth(startDate.getMonth() - 1); // 1 month padding
          break;
        case '6-months':
          startDate.setMonth(startDate.getMonth() - 3); // 3 months padding
          break;
        case 'year':
          startDate.setMonth(startDate.getMonth() - 6); // 6 months padding
          break;
      }
      
      // Calculate total units for the timeline based on time scale
      let totalUnits = calculateTotalDays();
      
      // Adjust total units based on time scale
      switch (timeScale) {
        case 'days':
          totalUnits = Math.min(totalUnits, 365); // Cap at 365 days
          break;
        case 'weeks':
          totalUnits = Math.ceil(totalUnits / 7); // Convert days to weeks
          totalUnits = Math.min(totalUnits, 52); // Cap at 52 weeks
          break;
        case 'months':
          totalUnits = Math.ceil(totalUnits / 30); // Approximate days to months
          totalUnits = Math.min(totalUnits, 24); // Cap at 24 months
          break;
        case '6-months':
          totalUnits = Math.ceil(totalUnits / 180); // Approximate days to half-years
          totalUnits = Math.min(totalUnits, 4); // Cap at 4 half-years
          break;
        case 'year':
          totalUnits = Math.ceil(totalUnits / 365); // Convert days to years
          totalUnits = Math.min(totalUnits, 5); // Cap at 5 years
          break;
      }
      
      if (totalUnits <= 0) {
        console.warn(`Invalid total units calculated: ${totalUnits}, defaulting to minimum`);
        totalUnits = timeScale === 'days' ? 60 : 
                    timeScale === 'weeks' ? 12 : 
                    timeScale === 'months' ? 6 : 
                    timeScale === '6-months' ? 2 : 1;
      }
      
      // Generate time header elements
      const headerElements = [];
      
      for (let i = 0; i < totalUnits; i++) {
        try {
          const currentDate = new Date(startDate);
          
          // Adjust date based on time scale and index
          switch (timeScale) {
            case 'days':
              currentDate.setDate(currentDate.getDate() + i);
              break;
            case 'weeks':
              currentDate.setDate(currentDate.getDate() + (i * 7));
              break;
            case 'months':
              currentDate.setMonth(currentDate.getMonth() + i);
              break;
            case '6-months':
              currentDate.setMonth(currentDate.getMonth() + (i * 6));
              break;
            case 'year':
              currentDate.setFullYear(currentDate.getFullYear() + i);
              break;
          }
          
          // Skip this iteration if the date is invalid
          if (isNaN(currentDate.getTime())) {
            console.warn(`Invalid date created at index ${i}, skipping`);
            continue;
          }
          
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          const isFirstOfMonth = currentDate.getDate() === 1;
          const isMonday = currentDate.getDay() === 1;
          
          let headerWidth = 20; // Default: 20px per day
          
          // Calculate header width based on time scale
          switch (timeScale) {
            case 'days':
              headerWidth = 20; // 20px per day
              break;
            case 'weeks':
              headerWidth = 100; // 100px per week
              break;
            case 'months':
              headerWidth = 300; // 300px per month
              break;
            case '6-months':
              headerWidth = 600; // 600px per half-year
              break;
            case 'year':
              headerWidth = 1200; // 1200px per year
              break;
          }
          
          headerElements.push(
            <div 
              key={`${timeScale}-${i}`} 
              className="gantt-timeline-day" 
              style={{ 
                flex: `0 0 ${headerWidth}px`,
                width: `${headerWidth}px`,
                backgroundColor: isWeekend && timeScale === 'days' ? '#f8f8f8' : 'white',
                borderRight: isFirstOfMonth || timeScale !== 'days' ? '2px solid #d0d0d0' : '1px solid #e0e0e0'
              }}
            >
              <div className="gantt-timeline-day-number">
                {timeScale === 'days' ? currentDate.getDate() : 
                 timeScale === 'weeks' ? `W${Math.ceil((currentDate.getDate() + 
                   new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}` :
                 timeScale === 'months' ? format(currentDate, 'MMM') :
                 timeScale === '6-months' ? (currentDate.getMonth() < 6 ? 'H1' : 'H2') :
                 format(currentDate, 'yyyy')}
              </div>
              {(isFirstOfMonth || isMonday || timeScale !== 'days') && (
                <div className="gantt-timeline-day-month">
                  {timeScale === 'days' ? format(currentDate, 'MMM') :
                   timeScale === 'weeks' ? format(currentDate, 'yyyy') :
                   timeScale === 'months' ? format(currentDate, 'yyyy') :
                   timeScale === '6-months' || timeScale === 'year' ? format(currentDate, 'yyyy') : ''}
                </div>
              )}
            </div>
          );
        } catch (headerError) {
          console.error(`Error generating header element at index ${i}:`, headerError);
          // Continue with the next element
        }
      }
      
      return headerElements;
    } catch (error) {
      console.error("Error generating timeline header:", error);
      return []; // Return empty array on error
    }
  };
  
  // Calculate the pixel position of a milestone based on its start date
  const calculateStartPosition = (milestone: GanttMilestone): number => {
    if (!selectedProject || !milestone) {
      return 0;
    }
    
    // Safety check: ensure milestone has valid properties
    if (!milestone.id || !milestone.start) {
      console.warn("Missing required properties in milestone:", milestone.id);
      return 0;
    }
    
    try {
      // Check if we have valid projectMilestones array
      if (!Array.isArray(projectMilestones) || projectMilestones.length === 0) {
        console.warn("No project milestones available for position calculation");
        return 0;
      }
      
      // Get only valid milestone dates
      const validMilestones = projectMilestones.filter(m => 
        m && m.start && 
        ((m.start instanceof Date && !isNaN(m.start.getTime())) || 
         (typeof m.start === 'string' && !isNaN(new Date(m.start).getTime())))
      );
      
      // If no valid milestones with dates, return default position
      if (validMilestones.length === 0) {
        console.warn("No valid milestone dates found for position calculation");
        return 0;
      }
      
      // Extract valid timestamps
      const startDates = validMilestones.map(m => {
        try {
          return m.start instanceof Date ? 
            m.start.getTime() : 
            new Date(m.start).getTime();
        } catch (dateErr) {
          console.error("Error converting milestone date to timestamp:", dateErr);
          return new Date().getTime(); // Fallback to current date
        }
      });
      
      // Find earliest valid date
      const earliestTimestamp = Math.min(...startDates);
      if (isNaN(earliestTimestamp)) {
        console.error("Failed to calculate valid earliest timestamp");
        return 0;
      }
      
      // Create chart start date
      const earliestDate = new Date(earliestTimestamp);
      const chartStartDate = new Date(earliestDate);
      chartStartDate.setDate(chartStartDate.getDate() - 5);
      
      // Ensure valid milestone start date
      let milestoneStart: Date;
      try {
        if (milestone.start instanceof Date) {
          if (isNaN(milestone.start.getTime())) {
            milestoneStart = new Date(); // Use current date if invalid
          } else {
            milestoneStart = milestone.start;
          }
        } else if (typeof milestone.start === 'string') {
          const parsedDate = new Date(milestone.start);
          if (isNaN(parsedDate.getTime())) {
            milestoneStart = new Date(); // Use current date if invalid
          } else {
            milestoneStart = parsedDate;
          }
        } else {
          milestoneStart = new Date(); // Default to current date
        }
      } catch (parseError) {
        console.error("Error parsing milestone start date:", parseError);
        milestoneStart = new Date(); // Default to current date
      }
      
      // Calculate position based on time difference according to current time scale
      try {
        // Get pixels per unit based on time scale
        let pixelsPerUnit = 20; // Default: 20px per day
        let timeDiff = 0;
        
        switch (timeScale) {
          case 'days':
            // Safely calculate days difference
            timeDiff = differenceInCalendarDays(milestoneStart, chartStartDate);
            pixelsPerUnit = 20; // 20px per day
            break;
            
          case 'weeks':
            // Calculate weeks difference and multiply by 7 to get days
            timeDiff = differenceInWeeks(milestoneStart, chartStartDate);
            pixelsPerUnit = 100; // 100px per week
            break;
            
          case 'months':
            // Calculate months difference
            timeDiff = differenceInMonths(milestoneStart, chartStartDate);
            pixelsPerUnit = 300; // 300px per month
            break;
            
          case '6-months':
            // Calculate half-year difference (6 months)
            timeDiff = Math.floor(differenceInMonths(milestoneStart, chartStartDate) / 6);
            pixelsPerUnit = 600; // 600px per 6 months
            break;
            
          case 'year':
            // Calculate years difference
            timeDiff = differenceInYears(milestoneStart, chartStartDate);
            pixelsPerUnit = 1200; // 1200px per year
            break;
            
          default:
            // Default to days scale
            timeDiff = differenceInCalendarDays(milestoneStart, chartStartDate);
            pixelsPerUnit = 20; // 20px per day
        }
        
        return Math.max(timeDiff * pixelsPerUnit, 0); // Ensure non-negative position
      } catch (diffError) {
        console.error("Error calculating time difference:", diffError);
        return 0; // Default position
      }
    } catch (error) {
      console.error("Error calculating start position for milestone:", milestone.id, error);
      return 0; // Default position on error
    }
  };
  
  // Calculate the width of a milestone bar in pixels
  const calculateBarWidth = (milestone: GanttMilestone): number => {
    try {
      if (!milestone.duration || milestone.duration === 0) return 20; // Width for zero-duration milestones
      
      // Ensure duration is a positive number
      const duration = Math.max(0, milestone.duration);
      
      // Calculate width based on time scale
      let pixelsPerUnit = 20; // Default: 20px per day
      let scaledDuration = duration;
      
      switch (timeScale) {
        case 'days':
          // Each day is 20px wide
          pixelsPerUnit = 20;
          scaledDuration = duration;
          break;
          
        case 'weeks':
          // Convert days to weeks and use 100px per week
          pixelsPerUnit = 100;
          scaledDuration = duration / 7;
          break;
          
        case 'months':
          // Convert days to months (approximate) and use 300px per month
          pixelsPerUnit = 300;
          scaledDuration = duration / 30;
          break;
          
        case '6-months':
          // Convert days to half-years and use 600px per half-year
          pixelsPerUnit = 600;
          scaledDuration = duration / 180;
          break;
          
        case 'year':
          // Convert days to years and use 1200px per year
          pixelsPerUnit = 1200;
          scaledDuration = duration / 365;
          break;
          
        default:
          // Default to days scale
          pixelsPerUnit = 20;
          scaledDuration = duration;
      }
      
      // Ensure a minimum width for visibility
      return Math.max(scaledDuration * pixelsPerUnit, 20);
    } catch (error) {
      console.error("Error calculating bar width:", error);
      return 20; // Default width
    }
  };
  
  // Drag and resize functionality
  const [dragState, setDragState] = useState<DragState>({
    isActive: false,
    milestoneId: null,
    startX: 0,
    originalStartPos: 0,
    originalWidth: 0,
    type: 'move'
  });
  
  // Function to detect overlapping milestones
  const detectOverlappingMilestones = useCallback((milestones: GanttMilestone[]): {[key: string]: string[]} => {
    const overlaps: {[key: string]: string[]} = {};
    
    // Skip if there are no milestones
    if (!milestones || milestones.length === 0) return overlaps;
    
    try {
      // Compare each milestone with every other milestone
      for (let i = 0; i < milestones.length; i++) {
        const milestoneA = milestones[i];
        
        // Skip milestones with duration 0 (they're point milestones)
        if (milestoneA.duration === 0) continue;
        
        for (let j = i + 1; j < milestones.length; j++) {
          const milestoneB = milestones[j];
          
          // Skip milestones with duration 0 (they're point milestones)
          if (milestoneB.duration === 0) continue;
          
          // Skip if they have different parent-child relationships
          const samePath = !milestoneA.parent && !milestoneB.parent || 
                           milestoneA.parent === milestoneB.parent;
          
          if (!samePath) continue;
          
          // Check if they overlap in time
          if (milestoneA.start <= milestoneB.end && milestoneB.start <= milestoneA.end) {
            // Record the overlap for both milestones
            if (!overlaps[milestoneA.id]) {
              overlaps[milestoneA.id] = [];
            }
            overlaps[milestoneA.id].push(milestoneB.id);
            
            if (!overlaps[milestoneB.id]) {
              overlaps[milestoneB.id] = [];
            }
            overlaps[milestoneB.id].push(milestoneA.id);
          }
        }
      }
    } catch (error) {
      console.error("Error detecting overlapping milestones:", error);
    }
    
    return overlaps;
  }, []);
  
  // State to track overlapping milestones
  const [overlappingMilestones, setOverlappingMilestones] = useState<{[key: string]: string[]}>({});
  
  // Effect to detect overlapping milestones when projectMilestones changes
  useEffect(() => {
    try {
      if (projectMilestones.length === 0) {
        setOverlappingMilestones({});
        return;
      }
      
      const overlaps = detectOverlappingMilestones(projectMilestones);
      setOverlappingMilestones(overlaps);
      
      // Log any overlaps for debugging
      const overlapsCount = Object.keys(overlaps).length;
      if (overlapsCount > 0) {
        console.log(`Detected ${overlapsCount} milestone overlaps`);
      }
    } catch (error) {
      console.error("Error in overlap detection effect:", error);
    }
  }, [projectMilestones, detectOverlappingMilestones]);
  
  // Get date from position
  const getDateFromPosition = (position: number): Date => {
    try {
      // Find the earliest valid date from milestones
      const validMilestones = projectMilestones.filter(m => 
        m && m.start && 
        ((m.start instanceof Date && !isNaN(m.start.getTime())) || 
         (typeof m.start === 'string' && !isNaN(new Date(m.start).getTime())))
      );
      
      if (validMilestones.length === 0) return new Date();
      
      const startDates = validMilestones.map(m => {
        return m.start instanceof Date ? 
          m.start.getTime() : 
          new Date(m.start).getTime();
      });
      
      const earliestTimestamp = Math.min(...startDates);
      if (isNaN(earliestTimestamp)) return new Date();
      
      const earliestDate = new Date(earliestTimestamp);
      const chartStartDate = new Date(earliestDate);
      chartStartDate.setDate(chartStartDate.getDate() - 5);
      
      // Calculate date based on position and time scale
      let pixelsPerUnit = 20; // Default: 20px per day
      let timeUnits = position / pixelsPerUnit;
      
      switch (timeScale) {
        case 'days':
          pixelsPerUnit = 20;
          return addDays(chartStartDate, timeUnits);
          
        case 'weeks':
          pixelsPerUnit = 100;
          return addWeeks(chartStartDate, timeUnits);
          
        case 'months':
          pixelsPerUnit = 300;
          return addMonths(chartStartDate, timeUnits);
          
        case '6-months':
          pixelsPerUnit = 600;
          return addMonths(chartStartDate, timeUnits * 6);
          
        case 'year':
          pixelsPerUnit = 1200;
          return addYears(chartStartDate, timeUnits);
          
        default:
          return addDays(chartStartDate, timeUnits);
      }
    } catch (error) {
      console.error("Error calculating date from position:", error);
      return new Date(); // Default to current date on error
    }
  };
  
  // Handler for starting a drag operation
  const handleDragStart = (milestoneId: string, clientX: number, type: 'move' | 'resize-start' | 'resize-end') => {
    const milestone = projectMilestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    const startPos = calculateStartPosition(milestone);
    const width = calculateBarWidth(milestone);
    
    setDragState({
      isActive: true,
      milestoneId,
      startX: clientX,
      originalStartPos: startPos,
      originalWidth: width,
      type
    });
    
    // Add event listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // Handler for dragging movement
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.isActive || !dragState.milestoneId) return;
    
    const currentMilestone = projectMilestones.find(m => m.id === dragState.milestoneId);
    if (!currentMilestone) return;
    
    const deltaX = e.clientX - dragState.startX;
    
    // Get pixelsPerUnit for the current time scale
    let pixelsPerUnit = 20; // Default: 20px per day
    
    switch (timeScale) {
      case 'days': pixelsPerUnit = 20; break;
      case 'weeks': pixelsPerUnit = 100; break;
      case 'months': pixelsPerUnit = 300; break;
      case '6-months': pixelsPerUnit = 600; break;
      case 'year': pixelsPerUnit = 1200; break;
    }
    
    // Create a working copy of the milestone to modify
    const updatedMilestone = { ...currentMilestone };
    
    // Calculate new positions based on drag type
    if (dragState.type === 'move') {
      // Move the entire milestone
      const newStartPos = Math.max(0, dragState.originalStartPos + deltaX);
      const newStartDate = getDateFromPosition(newStartPos);
      
      // Update the milestone dates while keeping the duration the same
      updatedMilestone.start = newStartDate;
      
      // Recalculate end date based on duration
      if (updatedMilestone.duration !== undefined) {
        switch (timeScale) {
          case 'days':
            updatedMilestone.end = addDays(newStartDate, updatedMilestone.duration);
            break;
          case 'weeks':
            updatedMilestone.end = addDays(newStartDate, updatedMilestone.duration);
            break;
          case 'months':
            updatedMilestone.end = addDays(newStartDate, updatedMilestone.duration);
            break;
          case '6-months':
            updatedMilestone.end = addDays(newStartDate, updatedMilestone.duration);
            break;
          case 'year':
            updatedMilestone.end = addDays(newStartDate, updatedMilestone.duration);
            break;
          default:
            updatedMilestone.end = addDays(newStartDate, updatedMilestone.duration);
        }
      }
    } 
    else if (dragState.type === 'resize-start') {
      // Resize the start edge (changes start date and duration)
      const newStartPos = Math.max(0, dragState.originalStartPos + deltaX);
      const newStartDate = getDateFromPosition(newStartPos);
      
      // Calculate new end position to keep end date fixed
      const originalEndPos = dragState.originalStartPos + dragState.originalWidth;
      const newDuration = Math.max(1, differenceInCalendarDays(new Date(currentMilestone.end), newStartDate));
      
      updatedMilestone.start = newStartDate;
      updatedMilestone.duration = newDuration;
    } 
    else if (dragState.type === 'resize-end') {
      // Resize the end edge (changes end date and duration)
      const newWidth = Math.max(20, dragState.originalWidth + deltaX);
      const endPos = dragState.originalStartPos + newWidth;
      const newEndDate = getDateFromPosition(endPos);
      
      // Calculate new duration
      const newDuration = Math.max(1, differenceInCalendarDays(newEndDate, new Date(currentMilestone.start)));
      
      updatedMilestone.end = newEndDate;
      updatedMilestone.duration = newDuration;
    }
    
    // Update the milestone in state
    setProjectMilestones(prev => 
      prev.map(m => m.id === dragState.milestoneId ? updatedMilestone : m)
    );
    
  }, [dragState, projectMilestones, timeScale]);
  
  // Handler for ending a drag operation
  const handleDragEnd = useCallback(() => {
    if (!dragState.isActive || !dragState.milestoneId) {
      // Reset state and remove handlers
      setDragState({
        isActive: false,
        milestoneId: null,
        startX: 0,
        originalStartPos: 0,
        originalWidth: 0,
        type: 'move'
      });
      
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      return;
    }
    
    // Get the updated milestone
    const updatedMilestone = projectMilestones.find(m => m.id === dragState.milestoneId);
    if (!updatedMilestone || !selectedProject) {
      // Reset state and remove handlers
      setDragState({
        isActive: false,
        milestoneId: null,
        startX: 0,
        originalStartPos: 0,
        originalWidth: 0,
        type: 'move'
      });
      
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      return;
    }
    
    // If this is connected to a parent project, update the project data
    if (onUpdate && selectedProject) {
      onUpdate(selectedProject, projectMilestones);
    }
    
    // Reset state and remove handlers
    setDragState({
      isActive: false,
      milestoneId: null,
      startX: 0,
      originalStartPos: 0,
      originalWidth: 0,
      type: 'move'
    });
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    toast({
      title: "Milestone Updated",
      description: `${updatedMilestone.title} has been updated`,
    });
    
  }, [dragState, onUpdate, projectMilestones, selectedProject, toast, handleDragMove]);
  
  // Function to add a new milestone
  const handleAddMilestone = () => {
    if (!selectedProject) return;
    
    const newMilestone: GanttMilestone = {
      id: `new_${Date.now()}`,
      title: "New Milestone",
      start: new Date(),
      end: addDays(new Date(), 7),
      color: "#3B82F6",
      projectId: selectedProject.id,
      projectName: selectedProject.projectNumber || "",
      editable: true,
      deletable: true,
      duration: 7,
      indent: 0,
      completed: 0
    };
    
    setEditingMilestone(newMilestone);
    setShowMilestoneDialog(true);
  };
  
  // Function to save edited milestone
  const handleSaveMilestone = (milestone: GanttMilestone) => {
    if (!selectedProject) return;
    
    // If it's a new milestone, add it
    if (!projectMilestones.find(m => m.id === milestone.id)) {
      setProjectMilestones(prev => [...prev, milestone]);
    } else {
      // Otherwise update existing milestone
      setProjectMilestones(prev => 
        prev.map(m => m.id === milestone.id ? milestone : m)
      );
    }
    
    setShowMilestoneDialog(false);
    setEditingMilestone(null);
    
    // If this is connected to a parent project, update the project data
    if (onUpdate && selectedProject) {
      onUpdate(selectedProject, [...projectMilestones.filter(m => m.id !== milestone.id), milestone]);
    }
  };
  
  // Function to delete a milestone
  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);
  
  const handleDeleteMilestone = (milestoneId: string) => {
    if (!selectedProject) return;
    
    // Show confirmation dialog instead of deleting immediately
    setMilestoneToDelete(milestoneId);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteMilestone = () => {
    if (!selectedProject || !milestoneToDelete) return;
    
    // Find the milestone to delete to check if it has child milestones
    const milestone = projectMilestones.find(m => m.id === milestoneToDelete);
    if (!milestone) {
      setShowDeleteDialog(false);
      setMilestoneToDelete(null);
      return;
    }
    
    // Check if this milestone has children (other milestones with this as parent)
    const hasChildren = projectMilestones.some(m => m.parent === milestone.id);
    
    // If it has children, also delete them
    if (hasChildren) {
      const childIds = projectMilestones
        .filter(m => m.parent === milestone.id)
        .map(m => m.id);
      
      // Remove the milestone and all its children
      const updatedMilestones = projectMilestones.filter(
        m => m.id !== milestoneToDelete && !childIds.includes(m.id)
      );
      
      setProjectMilestones(updatedMilestones);
      
      // If this is connected to a parent project, update the project data
      if (onUpdate && selectedProject) {
        onUpdate(selectedProject, updatedMilestones);
      }
    } else {
      // Just remove the single milestone
      setProjectMilestones(prev => prev.filter(m => m.id !== milestoneToDelete));
      
      // If this is connected to a parent project, update the project data
      if (onUpdate && selectedProject) {
        onUpdate(selectedProject, projectMilestones.filter(m => m.id !== milestoneToDelete));
      }
    }
    
    // Clear selection and close dialog
    setSelectedMilestoneId(null);
    setShowDeleteDialog(false);
    setMilestoneToDelete(null);
    
    toast({
      title: "Milestone Deleted",
      description: hasChildren 
        ? "The milestone and its sub-milestones have been deleted" 
        : "The milestone has been deleted",
    });
  };
  
  // No internal dialog component - using the extracted component instead
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="space-x-2">
          <Button 
            size="sm" 
            onClick={handleAddMilestone}
            disabled={!selectedProject}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Milestone
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              if (selectedMilestoneId && selectedProject) {
                const milestone = projectMilestones.find(m => m.id === selectedMilestoneId);
                if (milestone) handleEditMilestone(milestone);
              }
            }}
            disabled={!selectedMilestoneId}
          >
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            Edit
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              if (selectedMilestoneId) handleDeleteMilestone(selectedMilestoneId);
            }}
            disabled={!selectedMilestoneId}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showAllProjects ? "default" : "outline"}
            onClick={() => setShowAllProjects(!showAllProjects)}
          >
            <FontAwesomeIcon icon={faProjectDiagram} className="mr-2" />
            All Projects
          </Button>
        
          <Select 
            value={selectedProject?.id || ''} 
            onValueChange={(value) => {
              if (showAllProjects) setShowAllProjects(false);
              const project = projects.find(p => p.id === value);
              if (project) handleSelectProject(project);
            }}
            disabled={showAllProjects}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectNumber || project.name || project.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={timeScale}
            onValueChange={setTimeScale}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Scale" />
            </SelectTrigger>
            <SelectContent>
              {timeScaleOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedProject ? (
        <Card>
          <CardContent className="p-0">
            <div className="gantt-view">
              <div className="gantt-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Task Name</TableHead>
                      <TableHead className="w-[100px] text-right">Duration</TableHead>
                      <TableHead className="w-[120px]">Start</TableHead>
                      <TableHead className="w-[120px]">Finish</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectMilestones.map(milestone => (
                      <TableRow 
                        key={milestone.id}
                        className={selectedMilestoneId === milestone.id ? 'bg-secondary/20' : ''}
                        onClick={() => handleSelectMilestone(milestone)}
                      >
                        <TableCell className="w-[40px]">
                          {milestone.indent === 0 && milestone.isExpanded && (
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleMilestoneExpansion(milestone.id)}>
                              <FontAwesomeIcon icon={faChevronDown} />
                            </Button>
                          )}
                          {milestone.indent === 0 && !milestone.isExpanded && (
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleMilestoneExpansion(milestone.id)}>
                              <FontAwesomeIcon icon={faChevronRight} />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ marginLeft: `${milestone.indent ? milestone.indent * 20 : 0}px` }}>
                            {milestone.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{milestone.duration} days</TableCell>
                        <TableCell>
                          {milestone.start instanceof Date 
                            ? format(milestone.start, 'MM/dd/yyyy') 
                            : (typeof milestone.start === 'string' && !isNaN(new Date(milestone.start).getTime())
                              ? format(new Date(milestone.start), 'MM/dd/yyyy')
                              : 'Invalid date')}
                        </TableCell>
                        <TableCell>
                          {milestone.end instanceof Date 
                            ? format(milestone.end, 'MM/dd/yyyy') 
                            : (typeof milestone.end === 'string' && !isNaN(new Date(milestone.end).getTime())
                              ? format(new Date(milestone.end), 'MM/dd/yyyy')
                              : 'Invalid date')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="gantt-chart" ref={ganttChartContainerRef}>
                <div className="gantt-timeline">
                  {/* Timeline header with dates */}
                  <div className="gantt-timeline-header">
                    {generateTimelineHeader()}
                  </div>
                  
                  {/* Timeline display with bars for each milestone */}
                  <div className="relative">
                    {projectMilestones.filter(m => m && m.id).map(milestone => {
                      try {
                        // Calculate positions with safety checks
                        let startPosition = 0;
                        let width = 20; // Default minimum width
                        
                        try {
                          startPosition = calculateStartPosition(milestone);
                          width = calculateBarWidth(milestone);
                          
                          // Validate calculations
                          if (isNaN(startPosition) || startPosition < 0) {
                            console.warn(`Invalid start position for milestone ${milestone.id}: ${startPosition}`);
                            startPosition = 0;
                          }
                          
                          if (isNaN(width) || width < 20) {
                            console.warn(`Invalid width for milestone ${milestone.id}: ${width}`);
                            width = 20;
                          }
                        } catch (calcError) {
                          console.error(`Error calculating dimensions for milestone ${milestone.id}:`, calcError);
                        }
                        
                        return (
                          <div 
                            key={milestone.id}
                            className="gantt-row"
                          >
                          {milestone.duration === 0 ? (
                            <div 
                              id={`milestone-${milestone.id}`}
                              className={`gantt-milestone ${milestone && milestone.completed && milestone.completed >= 100 ? 'completed' : ''}`}
                              style={{ 
                                left: `${startPosition}px`,
                              }}
                              onClick={() => handleSelectMilestone(milestone)}
                            />
                          ) : (
                            <div 
                              id={`milestone-${milestone.id}`}
                              className={`gantt-bar ${dragState && dragState.isActive && dragState.milestoneId === milestone.id ? 'dragging' : ''} ${overlappingMilestones[milestone.id] ? 'overlapping' : ''}`}
                              style={{ 
                                width: `${width}px`, 
                                backgroundColor: milestone.color || '#3B82F6',
                                marginLeft: `${startPosition}px`,
                                cursor: 'move',
                                position: 'relative',
                                boxShadow: overlappingMilestones[milestone.id] ? '0 0 0 2px rgba(220, 38, 38, 0.7)' : 'none',
                              }}
                              onClick={() => handleSelectMilestone(milestone)}
                              onMouseDown={(e) => {
                                // Middle of bar is for moving
                                if (e.button === 0) { // Left click only
                                  handleDragStart(milestone.id, e.clientX, 'move');
                                  e.stopPropagation();
                                }
                              }}
                            >
                              {/* Left resize handle */}
                              <div 
                                className="resize-handle resize-handle-left"
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  width: '6px',
                                  height: '100%',
                                  cursor: 'w-resize',
                                  background: 'rgba(0,0,0,0.1)',
                                  borderTopLeftRadius: '4px',
                                  borderBottomLeftRadius: '4px',
                                }}
                                onMouseDown={(e) => {
                                  if (e.button === 0) { // Left click only
                                    handleDragStart(milestone.id, e.clientX, 'resize-start');
                                    e.stopPropagation();
                                  }
                                }}
                              />
                              
                              {/* Right resize handle */}
                              <div 
                                className="resize-handle resize-handle-right"
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  width: '6px',
                                  height: '100%',
                                  cursor: 'e-resize',
                                  background: 'rgba(0,0,0,0.1)',
                                  borderTopRightRadius: '4px',
                                  borderBottomRightRadius: '4px',
                                }}
                                onMouseDown={(e) => {
                                  if (e.button === 0) { // Left click only
                                    handleDragStart(milestone.id, e.clientX, 'resize-end');
                                    e.stopPropagation();
                                  }
                                }}
                              />
                              
                              {width > 50 && (
                                <div className="h-full flex items-center px-2 text-white text-xs overflow-hidden whitespace-nowrap">
                                  {milestone.title}
                                </div>
                              )}
                              
                              {milestone.completed && milestone.completed > 0 && (
                                <div 
                                  className="gantt-progress" 
                                  style={{ width: `${milestone.completed}%` }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                      } catch (renderError) {
                        console.error(`Error rendering milestone ${milestone?.id || 'unknown'}:`, renderError);
                        return null;
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Select a project to view and edit its Gantt chart.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Always render the dialog component, but control visibility with the dialog's open prop */}
      <MilestoneEditDialog 
        showDialog={showMilestoneDialog}
        setShowDialog={setShowMilestoneDialog}
        editingMilestone={editingMilestone}
        projectMilestones={projectMilestones}
        onSave={handleSaveMilestone}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {milestoneToDelete && (
              <>
                <p>Are you sure you want to delete this milestone?</p>
                {projectMilestones.some(m => m.parent === milestoneToDelete) && (
                  <p className="mt-2 text-yellow-600 dark:text-yellow-400">
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Warning: This will also delete all sub-milestones.
                  </p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setMilestoneToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteMilestone}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Styling for Gantt chart is in index.css */}
      
      {/* Render the dependency arrows component */}
      {projectMilestones.some(m => m.dependencies && m.dependencies.length > 0) && (
        <GanttDependencyArrows 
          milestones={projectMilestones}
          timeScale={timeScale}
          containerRef={ganttChartContainerRef}
        />
      )}
    </div>
  );
}