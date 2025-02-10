import { useState, useEffect } from "react";
import type { Project, ProjectStatus } from "@/types/manufacturing";
import { format } from "date-fns";

interface ProductionTimelineProps {
  project: Project;
  onStatusChange?: (status: ProjectStatus) => void;
}

export function ProductionTimeline({ project, onStatusChange }: ProductionTimelineProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>("NOT STARTED");

  useEffect(() => {
    if (!project) return;

    const startDate = project.fabricationStart 
      ? new Date(project.fabricationStart) 
      : project.assemblyStart 
      ? new Date(project.assemblyStart)
      : null;

    const endDate = project.ship 
      ? new Date(project.ship)
      : null;

    if (!startDate || !endDate) {
      setProgress(0);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const calculatedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    setProgress(calculatedProgress);

    // Calculate current status based on today's date
    const status = calculateCurrentStatus(project, today);
    setCurrentStatus(status);
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [project, onStatusChange]);

  const calculateCurrentStatus = (project: Project, today: Date): ProjectStatus => {
    const dates = {
      fabricationStart: project.fabricationStart ? new Date(project.fabricationStart) : null,
      assemblyStart: project.assemblyStart ? new Date(project.assemblyStart) : null,
      wrapGraphics: project.wrapGraphics ? new Date(project.wrapGraphics) : null,
      ntcTesting: project.ntcTesting ? new Date(project.ntcTesting) : null,
      qcStart: project.qcStart ? new Date(project.qcStart) : null,
      ship: project.ship ? new Date(project.ship) : null
    };

    if (dates.ship && today >= dates.ship) return "COMPLETED";
    if (dates.qcStart && today >= dates.qcStart) return "IN QC";
    if (dates.ntcTesting && today >= dates.ntcTesting) return "IN NTC TESTING";
    if (dates.wrapGraphics && today >= dates.wrapGraphics) return "IN WRAP";
    if (dates.assemblyStart && today >= dates.assemblyStart) return "IN ASSEMBLY";
    if (dates.fabricationStart && today >= dates.fabricationStart) return "IN FAB";
    return "NOT STARTED";
  };

  const isValidDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const formatDateLabel = (date: string) => {
    return format(new Date(date), 'MM/dd/yyyy');
  };

  const timelineEvents = [
    { date: project.fabricationStart, label: 'Fabrication Start', type: 'fab' },
    { date: project.assemblyStart, label: 'Assembly Start', type: 'assembly' },
    { date: project.wrapGraphics, label: 'Wrap/Graphics', type: 'wrap' },
    { date: project.ntcTesting, label: 'NTC Testing', type: 'ntc' },
    { date: project.qcStart, label: 'QC Start', type: 'qc' },
    { date: project.ship, label: 'Ship', type: 'ship' },
  ].filter(event => isValidDate(event.date))
   .map(event => ({
     ...event,
     formattedDate: event.date ? formatDateLabel(event.date) : ''
   }));

  if (timelineEvents.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDateTimeline = timelineEvents[0]?.date 
    ? new Date(timelineEvents[0].date)
    : new Date();

  const endDateTimeline = timelineEvents[timelineEvents.length - 1]?.date
    ? new Date(timelineEvents[timelineEvents.length - 1].date)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Calculate today's position on the timeline
  let todayPosition = ((today.getTime() - startDateTimeline.getTime()) / 
    (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

  // Handle cases where today is before timeline start
  if (today < startDateTimeline) {
    todayPosition = 0;
  }
  // Handle cases where today is after timeline end
  else if (today > endDateTimeline) {
    todayPosition = 100;
  }
  
  // Ensure dot stays within visible bounds
  todayPosition = Math.max(0.5, Math.min(99.5, todayPosition));

  const eventPositions = timelineEvents.map((event, index) => {
    if (!event.date) return { ...event, position: 0, needsOffset: false };
    
    // Set minimum position for first milestone
    if (index === 0) {
      return { ...event, position: Math.max(5, todayPosition + 3), needsOffset: false };
    }

    const eventDate = new Date(event.date);
    const position = ((eventDate.getTime() - startDateTimeline.getTime()) / 
      (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

    const prevPosition = index > 0 && timelineEvents[index - 1].date
      ? ((new Date(timelineEvents[index - 1].date).getTime() - startDateTimeline.getTime()) / 
         (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100
      : -20;

    const needsOffset = position - prevPosition < 15;

    return { ...event, position, needsOffset };
  });

  const hasShipped = project.ship && new Date(project.ship) <= today;

  // Find next upcoming milestone
  const nextMilestone = timelineEvents.find(event => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    return eventDate >= today;
  });

  // Calculate days until next milestone
  let daysMessage = '';
  if (nextMilestone?.date) {
    const eventDate = new Date(nextMilestone.date);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysMessage = diffDays === 0 
      ? `${nextMilestone.label} TODAY`
      : `${diffDays} days until ${nextMilestone.label}`;
  }

  return (
    <div className="mx-auto max-w-[95%]">
      <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
      <div className="relative pt-16 pb-8">
        {/* Timeline base */}
        <div className="relative h-2 w-full bg-gray-200 rounded overflow-hidden">
          {/* Progress bar */}
          <div 
            className={`absolute h-full rounded transition-all duration-1000 ease-in-out ${
              hasShipped ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: hasShipped ? '100%' : `${progress}%` }}
          />

          {/* Current date indicator with days until next milestone */}
          {!hasShipped && (
            <div 
              className="absolute flex flex-col items-center z-10" 
              style={{ 
                left: `${todayPosition}%`, 
                transform: 'translateX(-50%)',
                bottom: '-2px',
                width: '24px'
              }}
            >
              {daysMessage && (
                <div className="absolute -top-8 whitespace-nowrap text-center">
                  <div className="text-red-500 text-sm font-medium animate-pulse">
                    {daysMessage}
                  </div>
                </div>
              )}
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg" 
                   style={{
                     position: 'absolute',
                     top: '50%',
                     transform: 'translateY(-50%)'
                   }}
              />
            </div>
          )}

          {/* Shipped indicator */}
          {hasShipped && (
            <div className="absolute w-full text-center" style={{ top: '-2rem' }}>
              <span className="text-2xl font-bold text-red-500 animate-pulse">
                SHIPPED
              </span>
            </div>
          )}

          {/* Timeline events */}
          {eventPositions.map((event, index) => (
            <div key={`${event.type}-${index}`}>
              <div
                className="absolute"
                style={{
                  left: `${event.position}%`,
                  transform: 'translateX(-50%)',
                  bottom: '-1.5px'
                }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  event.date && new Date(event.date) <= today ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs">
                  {`${event.label} (${event.formattedDate})`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}