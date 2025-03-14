import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NCR } from "@/types/manufacturing/ncr";
import { MRB } from "@/types/manufacturing/mrb";
import { CAPA } from "@/types/manufacturing/capa";
import { cn } from "@/lib/utils";

type ItemType = 'ncr' | 'mrb' | 'capa';

interface EnhancedMilestoneTrackerProps {
  item: NCR | MRB | CAPA;
  type: ItemType;
  showLabels?: boolean;
  showBlinker?: boolean;
  className?: string;
}

type StatusMap = {
  [key: string]: number;
};

const ncrStatusMap: StatusMap = {
  'draft': 0,
  'open': 0,
  'under_review': 1,
  'pending_disposition': 2,
  'closed': 3
};

const mrbStatusMap: StatusMap = {
  'scheduled': 0,
  'in_progress': 1,
  'pending_decision': 2,
  'disposition_approved': 3,
  'closed': 4
};

const capaStatusMap: StatusMap = {
  'identified': 0,
  'investigation': 1,
  'action_planning': 2,
  'implementation': 3,
  'verification': 4,
  'closed': 5
};

export function EnhancedMilestoneTracker({
  item,
  type,
  showLabels = true,
  showBlinker = false,
  className
}: EnhancedMilestoneTrackerProps) {
  const [blink, setBlink] = useState(false);
  
  useEffect(() => {
    if (showBlinker) {
      const interval = setInterval(() => {
        setBlink(prev => !prev);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [showBlinker]);
  
  const getStatusMap = (): StatusMap => {
    switch (type) {
      case 'ncr':
        return ncrStatusMap;
      case 'mrb':
        return mrbStatusMap;
      case 'capa':
        return capaStatusMap;
      default:
        return ncrStatusMap;
    }
  };
  
  const getStatusLabels = (): string[] => {
    switch (type) {
      case 'ncr':
        return ['Created', 'In Review', 'Pending Disposition', 'Disposition Complete'];
      case 'mrb':
        return ['Scheduled', 'In Progress', 'Pending Decision', 'Disposition Approved', 'Closed'];
      case 'capa':
        return ['Identified', 'Investigation', 'Action Planning', 'Implementation', 'Verification', 'Closed'];
      default:
        return ['Created', 'In Review', 'Pending Disposition', 'Disposition Complete'];
    }
  };
  
  const getItemStatus = (): string => {
    return (item as any).status || 'draft';
  };
  
  const statusMap = getStatusMap();
  const labels = getStatusLabels();
  const currentStatus = getItemStatus();
  const currentStep = statusMap[currentStatus] || 0;
  const totalSteps = labels.length - 1;
  
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-sm">Progress</h4>
          <Badge variant="outline" className="capitalize">
            {currentStatus.replace('_', ' ')}
          </Badge>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 ease-in-out relative" 
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Small shine effect */}
            <div className="absolute top-0 right-0 h-full w-2 bg-white/30 blur-sm"></div>
            {/* Animated progress pulse for current step */}
            {currentStep < totalSteps && (
              <div className="absolute right-0 top-0 h-full w-1 animate-pulse bg-white/50"></div>
            )}
          </div>
        </div>
        
        {/* Status markers */}
        <div className="w-full flex justify-between items-center mt-2">
          {labels.map((label, index) => {
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className={cn(
                  "w-4 h-4 rounded-full mb-1 relative flex items-center justify-center",
                  isActive ? "bg-green-500" : "bg-muted-foreground/30",
                  isCurrent && "ring-2 ring-offset-1 ring-green-300"
                )}>
                  {isCurrent && showBlinker && (
                    <div className={cn(
                      "absolute inset-0 rounded-full",
                      blink ? "bg-blue-400 opacity-70" : "bg-blue-200 opacity-40",
                      "transition-all duration-500 ease-in-out animate-pulse"
                    )}
                    style={{
                      clipPath: `polygon(0 0, 50% 0, 50% 100%, 0 100%)`
                    }}
                    />
                  )}
                  {isCurrent && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  )}
                </div>
                
                {showLabels && (
                  <span className={cn(
                    "text-xs text-center hidden md:block",
                    isActive ? "text-foreground font-medium" : "text-muted-foreground",
                    isCurrent && "underline decoration-dotted underline-offset-4"
                  )}>
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}