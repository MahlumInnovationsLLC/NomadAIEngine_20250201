import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { NCR } from "@/types/manufacturing/ncr";
import type { CAPA } from "@/types/manufacturing/capa";
import type { SCAR } from "@/types/manufacturing/scar";
import type { MRB } from "@/types/manufacturing/mrb";
import { CalendarCheck, Clock, CheckCircle, AlertCircle, ThumbsUp, XCircle, FileText } from "lucide-react";

export type TimelineItemStatus = "pending" | "current" | "completed" | "skipped";

export interface TimelineItem {
  id: string;
  label: string;
  status: TimelineItemStatus;
  date?: string;
  tooltip?: string;
  icon?: React.ReactNode;
}

// For legacy milestone formats
export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: "complete" | "current" | "pending" | "skipped";
  date?: string;
  icon?: string;
  color?: string;
}

export interface MilestoneTimelineProps {
  items?: TimelineItem[];
  milestones?: Milestone[];
  currentMilestoneId?: string;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  showLabels?: boolean;
  showDates?: boolean;
  interactive?: boolean;
}

interface ItemStyleProps {
  status: TimelineItemStatus;
  size: "sm" | "md" | "lg";
}

const getItemStyles = ({ status, size }: ItemStyleProps) => {
  const baseStyles = {
    container: "relative flex items-center",
    circle: cn(
      "rounded-full flex items-center justify-center border z-10",
      size === "sm" ? "w-5 h-5 text-xs" : 
      size === "md" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
    ),
    line: cn(
      "absolute h-0.5 top-1/2 transform -translate-y-1/2 z-0",
      size === "sm" ? "-mx-1 right-0 left-[20px] w-[calc(100%-20px)]" : 
      size === "md" ? "-mx-2 right-0 left-[32px] w-[calc(100%-32px)]" : 
      "-mx-3 right-0 left-[40px] w-[calc(100%-40px)]"
    ),
    label: cn(
      "mt-2 font-medium", 
      size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
    ),
    date: cn(
      "text-muted-foreground", 
      size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
    ),
    // Add current marker indicator (red dot)
    currentMarker: cn(
      "absolute rounded-full bg-red-500 border border-white",
      size === "sm" ? "w-2.5 h-2.5 -top-1 -right-1" : 
      size === "md" ? "w-3 h-3 -top-1 -right-1" : 
      "w-4 h-4 -top-2 -right-2"
    )
  };

  const statusStyles = {
    pending: {
      circle: "bg-muted border-muted-foreground text-muted-foreground",
      line: "bg-muted"
    },
    current: {
      circle: "bg-primary/20 border-primary text-primary",
      line: "bg-primary/50"
    },
    completed: {
      circle: "bg-success/20 border-success text-success",
      line: "bg-success"
    },
    skipped: {
      circle: "bg-gray-100 border-gray-400 text-gray-400 line-through",
      line: "bg-gray-300"
    }
  };

  return {
    ...baseStyles,
    circle: cn(baseStyles.circle, statusStyles[status].circle),
    line: cn(baseStyles.line, statusStyles[status].line)
  };
};

const getStatusIcon = (status: TimelineItemStatus, customIcon?: React.ReactNode) => {
  if (customIcon) return customIcon;
  
  const iconSize = 16;
  
  switch (status) {
    case "pending":
      return <Clock size={iconSize} />;
    case "current":
      return <AlertCircle size={iconSize} />;
    case "completed":
      return <CheckCircle size={iconSize} />;
    case "skipped":
      return <XCircle size={iconSize} />;
    default:
      return <FileText size={iconSize} />;
  }
};

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  items,
  milestones,
  currentMilestoneId,
  compact,
  size = "md",
  orientation = "horizontal",
  showLabels = true,
  showDates = true,
  interactive = false
}) => {
  const isVertical = orientation === "vertical";
  
  // If legacy milestone format is used, convert to TimelineItem format
  let timelineItems: TimelineItem[] = [];
  
  if (items && items.length > 0) {
    timelineItems = items;
  } else if (milestones && milestones.length > 0) {
    timelineItems = milestones.map(milestone => ({
      id: milestone.id,
      label: milestone.title,
      status: convertStatus(milestone.status, milestone.id === currentMilestoneId),
      date: milestone.date,
      tooltip: milestone.description
    }));
  }
  
  if (timelineItems.length === 0) {
    return <div className="text-muted-foreground text-sm italic">No milestone data available</div>;
  }
  
  return (
    <div className={cn(
      "flex items-center justify-between w-full",
      isVertical ? "flex-col space-y-4" : compact ? "space-x-1" : "space-x-4"
    )}>
      {timelineItems.map((item, index) => {
        const styles = getItemStyles({ status: item.status, size });
        const isLast = index === timelineItems.length - 1;
        
        return (
          <div key={item.id} className={cn(
            styles.container,
            isVertical ? "flex-col" : "flex-row",
            "flex-1 min-w-0 relative", // Add flex-1 to distribute space evenly + relative for positioning
            compact && "px-1"  // Add some padding in compact mode
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    styles.circle,
                    interactive && item.status !== "skipped" && "cursor-pointer hover:scale-110 transition-transform",
                    "z-10 relative" // Ensure circles are above lines
                  )}>
                    {getStatusIcon(item.status, item.icon)}
                    {item.status === "current" && (
                      <div className={styles.currentMarker}></div>
                    )}
                  </div>
                </TooltipTrigger>
                {item.tooltip && (
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                    {item.date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            {!isLast && (
              <div 
                className={cn(
                  styles.line,
                  isVertical ? 
                    "w-0.5 h-4 left-1/2 -translate-x-1/2 top-full" : 
                    size === "sm" ? 
                      "right-0 left-[20px] w-[calc(100%-20px)]" : 
                      size === "md" ? 
                        "right-0 left-[32px] w-[calc(100%-32px)]" : 
                        "right-0 left-[40px] w-[calc(100%-40px)]",
                  "z-0" // Ensure lines are behind circles
                )} 
              />
            )}
            
            {showLabels && (
              <div className={cn(
                "flex flex-col items-center text-center whitespace-normal md:whitespace-nowrap",
                isVertical ? "mt-2" : "absolute top-full pt-2 w-full",
                compact && "text-[10px]" // Make text smaller in compact mode
              )}>
                <span className={styles.label}>{item.label}</span>
                {showDates && item.date && (
                  <span className={styles.date}>
                    {format(new Date(item.date), "MMM d")}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper function to convert from Milestone status to TimelineItem status
function convertStatus(status: "complete" | "current" | "pending" | "skipped", isCurrent: boolean = false): TimelineItemStatus {
  switch (status) {
    case "complete":
      return "completed";
    case "current":
      return "current";
    case "pending":
      return isCurrent ? "current" : "pending";
    case "skipped":
      return "skipped";
    default:
      return "pending";
  }
}

export function MiniMilestoneTimeline({ item, type, showLabels = true, className }: { 
  item: NCR | CAPA | SCAR | MRB;
  type: "ncr" | "capa" | "scar" | "mrb";
  showLabels?: boolean;
  className?: string;
}) {
  // Define milestones based on item type
  let items: TimelineItem[] = [];
  
  // Common formatting for all types
  const formatTimeline = (milestones: {label: string, status: TimelineItemStatus, date?: string}[]) => {
    return milestones.map((m, idx) => ({
      id: `${idx}`,
      label: m.label,
      status: m.status,
      date: m.date,
      tooltip: `${m.label}${m.date ? ` - ${format(new Date(m.date), "MMM d, yyyy")}` : ''}`
    }));
  };

  // Create timeline items based on the type
  switch (type) {
    case "ncr":
      const ncr = item as NCR;
      items = formatTimeline([
        {
          label: "Created",
          status: "completed",
          date: ncr.createdAt
        },
        {
          label: "In Review",
          status: ncr.status === "under_review" || ncr.status === "pending_disposition" || ncr.status === "closed" ? "completed" : 
                 ncr.status === "open" || ncr.status === "draft" ? "current" : "pending"
        },
        {
          label: "Pending Disposition",
          status: ncr.status === "pending_disposition" || ncr.status === "closed" ? "completed" : 
                 ncr.status === "under_review" ? "current" : "pending"
        },
        {
          label: "Disposition Complete",
          status: ncr.status === "closed" ? "completed" : 
                 ncr.status === "pending_disposition" ? "current" : "pending",
          date: ncr.closedDate
        }
      ]);
      break;
      
    case "capa":
      const capa = item as CAPA;
      items = formatTimeline([
        {
          label: "Draft",
          status: "completed",
          date: capa.createdAt
        },
        {
          label: "Open",
          status: capa.status === "open" || capa.status === "in_progress" || capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" ? "completed" : 
                 capa.status === "draft" ? "current" : "pending"
        },
        {
          label: "In Progress",
          status: capa.status === "in_progress" || capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" ? "completed" :
                 capa.status === "open" ? "current" : "pending"
        },
        {
          label: "Verification",
          status: capa.status === "pending_verification" || capa.status === "verified" || capa.status === "closed" ? "completed" :
                 capa.status === "in_progress" ? "current" : "pending"
        },
        {
          label: "Closed",
          status: capa.status === "closed" ? "completed" : "pending",
          date: capa.closedDate
        }
      ]);
      break;
      
    case "scar":
      const scar = item as SCAR;
      items = formatTimeline([
        {
          label: "Draft",
          status: "completed",
          date: scar.createdAt
        },
        {
          label: "Issued",
          status: scar.status === "issued" || scar.status === "supplier_response" || scar.status === "review" || scar.status === "closed" ? "completed" :
                 scar.status === "draft" ? "current" : "pending",
          date: scar.issueDate
        },
        {
          label: "Response",
          status: scar.status === "supplier_response" || scar.status === "review" || scar.status === "closed" ? "completed" :
                 scar.status === "issued" ? "current" : "pending",
          date: scar.supplierResponse?.responseDate
        },
        {
          label: "Review",
          status: scar.status === "review" || scar.status === "closed" ? "completed" :
                 scar.status === "supplier_response" ? "current" : "pending",
          date: scar.reviewDate
        },
        {
          label: "Closed",
          status: scar.status === "closed" ? "completed" : "pending",
          date: scar.closeDate // SCAR uses closeDate, not closedDate
        }
      ]);
      break;
      
    case "mrb":
      const mrb = item as MRB;
      items = formatTimeline([
        {
          label: "Pending",
          status: "completed",
          date: mrb.createdAt
        },
        {
          label: "In Review",
          status: mrb.status === "in_review" || mrb.status === "pending_disposition" || mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed" ? "completed" :
                 mrb.status === "pending_review" ? "current" : "pending",
          date: mrb.reviewDate
        },
        {
          label: "Disposition",
          status: mrb.status === "pending_disposition" || mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed" ? "completed" :
                 mrb.status === "in_review" ? "current" : "pending",
          date: mrb.disposition?.approvalDate
        },
        {
          label: "Decision",
          status: (mrb.status === "approved" || mrb.status === "rejected" || mrb.status === "closed") ? "completed" :
                 mrb.status === "pending_disposition" ? "current" : "pending"
        },
        {
          label: "Closed",
          status: mrb.status === "closed" ? "completed" : "pending",
          date: mrb.closedDate
        }
      ]);
      break;
  }

  return (
    <div className={cn("w-full px-1 py-2", className)}>
      <MilestoneTimeline 
        items={items} 
        size="sm" 
        showLabels={showLabels}
        showDates={false}
        compact={false}
      />
      {/* Add current status indicator */}
      {!showLabels && (
        <div className="text-center text-xs mt-1 text-muted-foreground">
          {type === "ncr" && (item as NCR).status && (
            <span className="capitalize">{(item as NCR).status.replace(/_/g, ' ')}</span>
          )}
          {type === "capa" && (item as CAPA).status && (
            <span className="capitalize">{(item as CAPA).status.replace(/_/g, ' ')}</span>
          )}
          {type === "scar" && (item as SCAR).status && (
            <span className="capitalize">{(item as SCAR).status.replace(/_/g, ' ')}</span>
          )}
          {type === "mrb" && (item as MRB).status && (
            <span className="capitalize">{(item as MRB).status.replace(/_/g, ' ')}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default MilestoneTimeline;