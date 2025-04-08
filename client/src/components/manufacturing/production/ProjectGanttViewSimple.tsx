import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { faProjectDiagram, faChevronRight, faChevronDown } from "@fortawesome/pro-light-svg-icons";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Project, ProjectStatus } from "@/types/manufacturing";

// Helper functions
function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'MM/dd/yyyy');
}

interface GanttMilestone {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  projectId: string;
  projectName: string;
  duration: number; // Duration in days
  indent: number; // Indentation level for hierarchical display
  parent?: string; // Parent milestone ID for hierarchical relationships
  completed: number; // Percentage completed (0-100)
  isExpanded?: boolean; // Whether sub-milestones are visible
}

interface MilestoneTemplate {
  key: string;
  title: string;
  duration: number;
  color: string;
  indent: number;
  parent?: string;
}

interface ProjectGanttViewProps {
  projects: Project[];
  onUpdate?: (project: Project, milestones: GanttMilestone[]) => void;
}

export function ProjectGanttView({ projects, onUpdate }: ProjectGanttViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMilestones, setProjectMilestones] = useState<GanttMilestone[]>([]);
  const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
  
  // Select a project
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      handleSelectProject(projects[0]);
    }
    setLoading(false);
  }, [projects]);

  // Helper function to get status color
  function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#22c55e'; // Green
      case 'in progress':
        return '#3b82f6'; // Blue
      case 'completed':
        return '#6b7280'; // Gray
      case 'delayed':
        return '#ef4444'; // Red
      case 'on hold':
        return '#f59e0b'; // Amber
      default:
        return '#3b82f6'; // Default blue
    }
  }

  // Generate standard milestones for a project
  const generateStandardMilestones = (project: Project): GanttMilestone[] => {
    if (!project) return [];
    
    const standardTemplates: MilestoneTemplate[] = [
      { key: 'planning', title: 'Planning Phase', duration: 14, color: '#a3a3a3', indent: 0 },
      { key: 'design', title: 'Design & Engineering', duration: 21, color: '#93c5fd', indent: 0 },
      { key: 'fabrication', title: 'Fabrication', duration: 28, color: '#60a5fa', indent: 0 },
      { key: 'assembly', title: 'Assembly', duration: 21, color: '#3b82f6', indent: 0 },
      { key: 'quality', title: 'Testing & QC', duration: 14, color: '#eab308', indent: 0 },
      { key: 'delivery', title: 'Shipping & Delivery', duration: 7, color: '#22c55e', indent: 0 }
    ];
    
    // Parse project dates
    const today = new Date();
    const baseDate = project.fabricationStart ? new Date(project.fabricationStart) : today;
    let currentDate = new Date(baseDate);
    
    // Generate milestone dates based on template durations
    return standardTemplates.map(template => {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + template.duration);
      
      // Set up the next milestone to start after this one
      currentDate = new Date(endDate);
      
      // Calculate progress based on dates and current status
      let completed = 0;
      if (today > endDate) {
        completed = 100;
      } else if (today > startDate) {
        const totalDuration = template.duration;
        const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        completed = Math.min(Math.round((daysElapsed / totalDuration) * 100), 100);
      }
      
      return {
        id: `${project.id}_${template.key}`,
        title: template.title,
        start: startDate,
        end: endDate,
        color: template.color,
        projectId: project.id,
        projectName: project.projectNumber || project.name || project.id.substring(0, 8),
        duration: template.duration,
        indent: template.indent,
        parent: template.parent,
        completed,
        isExpanded: false
      };
    });
  };

  const handleSelectProject = (project: Project) => {
    if (!project) return;

    setSelectedProject(project);
    const milestones = generateStandardMilestones(project);
    setProjectMilestones(milestones);
  };

  // Render the Gantt chart component
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
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
        </div>
      </div>
      
      {selectedProject ? (
        <Card>
          <CardContent className="p-0">
            <div className="gantt-view p-4">
              <h2 className="text-xl font-bold mb-4">
                {selectedProject.projectNumber || selectedProject.name} Milestones
              </h2>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead className="w-[100px] text-right">Duration</TableHead>
                    <TableHead className="w-[120px]">Start</TableHead>
                    <TableHead className="w-[120px]">Finish</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectMilestones.map(milestone => (
                    <TableRow key={milestone.id}>
                      <TableCell>
                        <div style={{ marginLeft: `${milestone.indent * 20}px` }}>
                          {milestone.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{milestone.duration} days</TableCell>
                      <TableCell>{formatDate(milestone.start)}</TableCell>
                      <TableCell>{formatDate(milestone.end)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="simple-gantt-chart mt-8 p-4 border rounded">
                <div className="text-center mb-4">Gantt Chart Visual Representation</div>
                <div className="gantt-bars space-y-2">
                  {projectMilestones.map(milestone => (
                    <div key={milestone.id} className="relative h-8 flex items-center">
                      <div 
                        className="rounded-md h-6" 
                        style={{ 
                          backgroundColor: milestone.color || '#3B82F6',
                          width: `${Math.max(milestone.duration * 5, 20)}px`,
                          marginLeft: `${milestone.indent * 20}px`
                        }}
                      >
                        {milestone.duration > 5 && (
                          <div className="h-full flex items-center px-2 text-white text-xs overflow-hidden whitespace-nowrap">
                            {milestone.title}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Select a project to view its Gantt chart.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}