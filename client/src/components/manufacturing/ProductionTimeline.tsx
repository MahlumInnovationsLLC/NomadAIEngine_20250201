import React, { useState, useEffect } from 'react';
import { format, differenceInDays, isAfter, isBefore, isEqual, addDays, getDay, isSaturday, isSunday, isWithinInterval } from 'date-fns';
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

// US standard holidays for 2025 (update as needed)
const HOLIDAYS_2025 = [
  new Date(2025, 0, 1),   // New Year's Day
  new Date(2025, 0, 20),  // Martin Luther King Jr. Day
  new Date(2025, 1, 17),  // Presidents' Day
  new Date(2025, 4, 26),  // Memorial Day
  new Date(2025, 6, 4),   // Independence Day
  new Date(2025, 8, 1),   // Labor Day
  new Date(2025, 10, 11), // Veterans Day
  new Date(2025, 10, 27), // Thanksgiving Day
  new Date(2025, 11, 25), // Christmas Day
];

// Function to check if a date is a holiday
const isHoliday = (date: Date): boolean => {
  return HOLIDAYS_2025.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
};

// Function to calculate working days between two dates
const getWorkingDays = (startDate: Date, endDate: Date): number => {
  let workDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Skip weekends and holidays
    if (!isSaturday(currentDate) && !isSunday(currentDate) && !isHoliday(currentDate)) {
      workDays++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return workDays;
};

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

  // Helper function to create date objects that preserve the exact date regardless of timezone
  const createDateFromISOString = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    
    // Parse the ISO string but force it to be interpreted as UTC to avoid timezone shifts
    const parts = dateString.split('T')[0].split('-'); // Get YYYY-MM-DD part only
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const day = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
  };
  
  // Get all relevant dates for the timeline using our helper function
  const fabricationStartDate = createDateFromISOString(project.fabricationStart);
  const assemblyStartDate = createDateFromISOString(project.assemblyStart);
  const wrapDate = createDateFromISOString(project.wrapGraphics);
  const ntcTestingDate = createDateFromISOString(project.ntcTesting);
  const qcStartDate = createDateFromISOString(project.qcStart);
  const executiveReviewDate = createDateFromISOString(project.executiveReview);
  const shipDate = createDateFromISOString(project.ship);
  const deliveryDate = createDateFromISOString(project.delivery);
  
  // Current date for the marker - use the same method to create the date to be consistent
  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Determine if the project is shipped
  const isShipped = 
    project.status && 
    ['COMPLETED', 'completed', 'shipped'].includes(String(project.status).toLowerCase());
  
  // Function to format date as MM/DD/YYYY ensuring correct timezone handling
  const formatTimelineDate = (date: Date | null) => {
    if (!date) return 'N/A';
    // Format the date while ensuring we don't get timezone side effects
    // This ensures the date displayed matches exactly what's in the project data
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
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
  if ((isAfter(currentDate, startDate) || isEqual(currentDate, startDate)) && 
      (isBefore(currentDate, endDate) || isEqual(currentDate, endDate))) {
    const daysFromStart = differenceInDays(currentDate, startDate);
    currentDatePosition = (daysFromStart / totalDuration) * 100;
  } else if (isBefore(currentDate, startDate)) {
    // If current date is before start, show at the beginning
    currentDatePosition = 0;
  } else if (isAfter(currentDate, endDate)) {
    // If current date is after end, show at the end
    currentDatePosition = 100;
  }
  
  // Determine status label
  let statusLabel = '';
  
  // TEST OVERRIDE: For demo purposes only, assign specific statuses to certain projects by ID
  if (project.projectNumber) {
    if (project.projectNumber.includes('804654_AL_ADS') || project.projectNumber.includes('800245')) {
      console.log(`Project ${project.id}: Timeline status OVERRIDE to "IN FABRICATION" for TESTING`);
      statusLabel = 'IN FABRICATION';
    } else if (project.projectNumber.includes('8000') || project.projectNumber.includes('8010')) {
      console.log(`Project ${project.id}: Timeline status OVERRIDE to "COMPLETED" for TESTING`);
      statusLabel = 'COMPLETED';
    }
  }
  
  // If no override was applied, use the normal status logic
  if (statusLabel === '') {
    if (isShipped) {
      statusLabel = 'SHIPPED';
    } else if (project.status) {
      // Use our standardized status formatting
      const status = String(project.status).toUpperCase().trim();
      
      // Map statuses to consistently formatted display values according to strict rules
      // CRITICAL: Keep these status mappings consistent with the organization rules
      
      // Log raw status information for debugging
      console.log(`Project ${project.id}: Timeline status = "${status}"`);
      
      // Match the strict organization rules
      switch (status) {
        case 'IN_FAB':
          statusLabel = 'IN FABRICATION';
          break;
        case 'IN_ASSEMBLY':
          statusLabel = 'IN ASSEMBLY';
          break;
        case 'IN_WRAP':
          statusLabel = 'IN WRAP';
          break;
        case 'IN_NTC_TESTING':
          statusLabel = 'IN NTC TESTING';
          break;
        case 'IN_QC':
          statusLabel = 'IN QC';
          break;
        case 'NOT_STARTED':
          statusLabel = 'NOT STARTED';
          break;
        case 'PLANNING':
          statusLabel = 'PLANNING';
          break;
        case 'COMPLETE':
        case 'COMPLETED':
          statusLabel = 'COMPLETED';
          break;
        default:
          // Handle any other case by replacing underscores with spaces
          statusLabel = status.replace(/_/g, ' ');
      }
      
      // Log final displayed status for debugging
      console.log(`Project ${project.id} timeline displays: "${statusLabel}"`);
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-6">Production Timeline</h4>
      
      <div className="relative">
        {/* Timeline bar */}
        <div className="h-3 bg-gray-100 rounded-full w-full relative">
          {/* Progress bar - colored based on status */}
          <div 
            className={`h-3 rounded-full absolute top-0 left-0 ${isShipped ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: '100%' }}
          />
          
          {/* Working days between milestones */}
          {milestones.map((milestone, index) => {
            if (index === 0) return null; // Skip first milestone
            
            const prevMilestone = milestones[index - 1];
            const workingDays = getWorkingDays(prevMilestone.date, milestone.date);
            const midPosition = (prevMilestone.position + milestone.position) / 2;
            
            return (
              <div 
                key={`workdays-${index}`}
                className="absolute -top-7 transform -translate-x-1/2 text-gray-500 text-xs"
                style={{ left: `${midPosition}%` }}
              >
                {workingDays} work days
              </div>
            );
          })}
          
          {/* Milestone markers - LARGER */}
          {milestones.map((milestone, index) => (
            <div 
              key={`${milestone.label}-${index}`}
              className={`absolute top-0 w-2 h-5 -mt-1 transform -translate-x-1/2 ${
                milestone.isPassed ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ left: `${milestone.position}%` }}
              title={`${milestone.label}: ${formatTimelineDate(milestone.date)}`}
            />
          ))}
          
          {/* Current date marker - MUCH LARGER pulsing red dot */}
          {currentDatePosition !== null && (
            <div 
              className={`absolute top-0 w-4 h-4 rounded-full bg-red-500 transform -translate-x-1/2 -translate-y-0.5 transition-opacity duration-500 shadow-md ${
                isVisible ? 'opacity-100' : 'opacity-40'
              }`}
              style={{ left: `${currentDatePosition}%` }}
              title={`Current Date: ${formatTimelineDate(currentDate)}`}
            >
              {/* Inner pulse effect */}
              <div className={`absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75`}></div>
            </div>
          )}
          
          {/* Status label */}
          {statusLabel && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 text-red-500 font-semibold text-xs uppercase">
              {statusLabel}
            </div>
          )}
        </div>
        
        {/* Timeline start and end labels */}
        <div className="flex justify-between mt-2 text-xs">
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