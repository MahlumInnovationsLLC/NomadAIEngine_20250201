import React, { useState, useEffect } from 'react';
import { format, differenceInDays, isAfter, isBefore, isEqual } from 'date-fns';
import type { CombinedProject } from './ProductionLinePanel';

interface ProductionTimelineProps {
  project: CombinedProject;
}

interface Milestone {
  date: Date;
  label: string;
  position: number; // Percentage position on timeline (0-100)
  isPassed: boolean;
}

/**
 * A component that displays a production timeline similar to the one in Project Management Tab
 */
export function ProductionTimeline({ project }: ProductionTimelineProps) {
  // Pulsating effect for current date marker
  const [isVisible, setIsVisible] = useState(true);
  
  // Set up pulsating effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 500); // Toggle every 500ms for a flashing effect
    
    return () => clearInterval(interval);
  }, []);

  // Get all relevant dates for the timeline
  const fabricationStartDate = project.fabricationStart ? new Date(project.fabricationStart) : null;
  const assemblyStartDate = project.assemblyStart ? new Date(project.assemblyStart) : null;
  const wrapDate = project.wrapGraphics ? new Date(project.wrapGraphics) : null;
  const ntcTestingDate = project.ntcTesting ? new Date(project.ntcTesting) : null;
  const qcStartDate = project.qcStart ? new Date(project.qcStart) : null;
  const executiveReviewDate = project.executiveReview ? new Date(project.executiveReview) : null;
  const shipDate = project.ship ? new Date(project.ship) : null;
  const deliveryDate = project.delivery ? new Date(project.delivery) : null;
  
  // Current date for the marker
  const currentDate = new Date();
  
  // Determine if the project is shipped
  const isShipped = 
    project.status && 
    ['COMPLETED', 'completed', 'shipped'].includes(String(project.status).toLowerCase());
  
  // Function to format date as MM/DD/YYYY
  const formatTimelineDate = (date: Date | null) => {
    return date ? format(date, 'MM/dd/yyyy') : 'N/A';
  };

  // If we have no dates at all, we can't show a timeline
  if (!fabricationStartDate && !assemblyStartDate && !wrapDate && !ntcTestingDate && 
      !qcStartDate && !executiveReviewDate && !shipDate && !deliveryDate) {
    return (
      <div className="mt-2">
        <h4 className="text-sm font-medium">Production Timeline</h4>
        <div className="text-sm text-muted-foreground">No timeline data available</div>
      </div>
    );
  }

  // Create an array of valid milestones from earliest to latest
  let milestones: Milestone[] = [];
  
  // Helper to add a milestone if the date exists
  const addMilestone = (date: Date | null, label: string) => {
    if (date) {
      milestones.push({
        date,
        label,
        position: 0, // We'll calculate this after sorting
        isPassed: isAfter(currentDate, date) || isEqual(currentDate, date)
      });
    }
  };
  
  // Add all existing milestones
  addMilestone(fabricationStartDate, 'Fabrication');
  addMilestone(assemblyStartDate, 'Assembly');
  addMilestone(wrapDate, 'Wrap');
  addMilestone(ntcTestingDate, 'NTC Testing');
  addMilestone(qcStartDate, 'QC');
  addMilestone(executiveReviewDate, 'Exec Review');
  addMilestone(shipDate, 'Ship');
  addMilestone(deliveryDate, 'Delivery');
  
  // Sort milestones by date
  milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // We need at least one milestone to show a timeline
  if (milestones.length === 0) {
    return (
      <div className="mt-2">
        <h4 className="text-sm font-medium">Production Timeline</h4>
        <div className="text-sm text-muted-foreground">No timeline data available</div>
      </div>
    );
  }
  
  // Calculate the timeline start and end dates
  const startDate = milestones[0].date;
  const endDate = milestones[milestones.length - 1].date;
  
  // Calculate the total duration in days
  const totalDuration = differenceInDays(endDate, startDate) || 1; // Prevent division by zero
  
  // Calculate position for each milestone
  milestones = milestones.map(milestone => {
    const daysFromStart = differenceInDays(milestone.date, startDate);
    const position = (daysFromStart / totalDuration) * 100;
    return { ...milestone, position };
  });
  
  // Calculate current date position if it's within the timeline
  let currentDatePosition: number | null = null;
  if (isAfter(currentDate, startDate) && isBefore(currentDate, endDate)) {
    const daysFromStart = differenceInDays(currentDate, startDate);
    currentDatePosition = (daysFromStart / totalDuration) * 100;
  }
  
  // Determine status label
  let statusLabel = '';
  if (isShipped) {
    statusLabel = 'SHIPPED';
  } else if (project.status) {
    const status = String(project.status).toUpperCase();
    if (status === 'IN_FAB') statusLabel = 'IN FABRICATION';
    else if (status === 'IN_ASSEMBLY') statusLabel = 'IN ASSEMBLY';
    else if (status === 'IN_WRAP') statusLabel = 'IN WRAP';
    else if (status === 'IN_NTC_TESTING') statusLabel = 'IN NTC TESTING';
    else if (status === 'IN_QC') statusLabel = 'IN QC';
    else statusLabel = status.replace('_', ' ');
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Production Timeline</h4>
      
      <div className="relative">
        {/* Timeline bar */}
        <div className="h-2 bg-gray-100 rounded-full w-full relative">
          {/* Progress bar - colored based on status */}
          <div 
            className={`h-2 rounded-full absolute top-0 left-0 ${isShipped ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: '100%' }}
          />
          
          {/* Milestone markers */}
          {milestones.map((milestone, index) => (
            <div 
              key={`${milestone.label}-${index}`}
              className={`absolute top-0 w-1 h-3 -mt-0.5 transform -translate-x-1/2 ${
                milestone.isPassed ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ left: `${milestone.position}%` }}
              title={`${milestone.label}: ${formatTimelineDate(milestone.date)}`}
            />
          ))}
          
          {/* Current date marker - pulsing red dot */}
          {currentDatePosition !== null && (
            <div 
              className={`absolute top-0 w-2 h-2 rounded-full bg-red-500 transform -translate-x-1/2 -translate-y-0 transition-opacity duration-500 ${
                isVisible ? 'opacity-100' : 'opacity-40'
              }`}
              style={{ left: `${currentDatePosition}%` }}
              title={`Current Date: ${formatTimelineDate(currentDate)}`}
            />
          )}
          
          {/* Status label */}
          {statusLabel && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-red-500 font-semibold text-xs uppercase">
              {statusLabel}
            </div>
          )}
        </div>
        
        {/* Timeline start and end labels */}
        <div className="flex justify-between mt-1 text-xs">
          <div>
            {milestones[0].label} ({formatTimelineDate(milestones[0].date)})
          </div>
          <div>
            {milestones[milestones.length - 1].label} ({formatTimelineDate(milestones[milestones.length - 1].date)})
          </div>
        </div>
        
        {/* Milestone tooltip hints */}
        <div className="mt-1 text-xs text-center text-muted-foreground">
          Hover over markers for milestone dates
        </div>
      </div>
    </div>
  );
}