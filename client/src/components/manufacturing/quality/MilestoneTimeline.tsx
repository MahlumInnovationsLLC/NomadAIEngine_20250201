import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MilestoneStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';

export interface Milestone {
  id: string;
  label: string;
  status: MilestoneStatus;
  date?: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  currentMilestoneId: string;
  compact?: boolean;
}

export function MilestoneTimeline({ milestones, currentMilestoneId, compact = false }: MilestoneTimelineProps) {
  const currentMilestoneIndex = milestones.findIndex(m => m.id === currentMilestoneId);
  
  return (
    <div className={cn("relative", compact ? "mt-2" : "mt-4")}>
      {/* Timeline connector line */}
      <div className="absolute left-0 top-4 w-full h-0.5 bg-muted" />
      
      <div className="relative flex justify-between">
        {milestones.map((milestone, index) => {
          const isActive = milestone.id === currentMilestoneId;
          const isPast = index < currentMilestoneIndex;
          const isFuture = index > currentMilestoneIndex;
          
          return (
            <div 
              key={milestone.id} 
              className={cn(
                "flex flex-col items-center relative", 
                compact ? "space-y-1" : "space-y-2"
              )}
            >
              {/* Milestone dot */}
              <div 
                className={cn(
                  "w-4 h-4 rounded-full z-10 border-2", 
                  isActive ? "border-primary bg-primary animate-pulse" : 
                  isPast && milestone.status === 'completed' ? "border-primary bg-primary" : 
                  isPast && milestone.status === 'skipped' ? "border-muted-foreground bg-background" : 
                  "border-muted-foreground bg-background"
                )}
              />
              
              {/* Milestone label */}
              <span 
                className={cn(
                  "text-xs text-center whitespace-nowrap max-w-24 truncate", 
                  isActive ? "font-medium text-primary" : 
                  isPast ? "text-muted-foreground" : 
                  "text-muted-foreground"
                )}
                title={milestone.label}
              >
                {milestone.label}
              </span>
              
              {/* Status badge - only show on active or in larger view */}
              {(!compact || isActive) && (
                <Badge 
                  variant={
                    milestone.status === 'completed' ? "default" : 
                    milestone.status === 'in-progress' ? "secondary" : 
                    milestone.status === 'skipped' ? "outline" : 
                    "outline"
                  }
                  className={cn(
                    "text-[0.65rem]",
                    compact ? "absolute -bottom-6" : ""
                  )}
                >
                  {milestone.status === 'completed' ? "Complete" : 
                   milestone.status === 'in-progress' ? "In Progress" : 
                   milestone.status === 'skipped' ? "Skipped" : 
                   "Pending"}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}