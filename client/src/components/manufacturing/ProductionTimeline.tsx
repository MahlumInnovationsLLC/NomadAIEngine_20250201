import { useState, useEffect } from "react";
import type { Project } from "@/types/manufacturing";

interface ProductionTimelineProps {
  project: Project;
}

export function ProductionTimeline({ project }: ProductionTimelineProps) {
  const [progress, setProgress] = useState(0);

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
  }, [project]);

  if (!project) return null;

  const isValidDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Display dates exactly as stored in project data without timezone manipulation
  const displayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${month}/${day}/${year}`;
  };

  // Calculate working days between two dates (excluding weekends)
  const calculateWorkingDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let days = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasShipped = project.ship && new Date(project.ship) <= today;

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
     formattedDate: event.date ? displayDate(event.date) : ''
   }));

  if (timelineEvents.length === 0) return null;

  const startDateTimeline = timelineEvents[0]?.date 
    ? new Date(timelineEvents[0].date)
    : today;

  const endDateTimeline = timelineEvents[timelineEvents.length - 1]?.date
    ? new Date(timelineEvents[timelineEvents.length - 1].date)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000);

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

  const eventPositions = timelineEvents.map((event, index) => {
    if (!event.date) return { ...event, position: 0, needsOffset: false };

    const eventDate = new Date(event.date);
    const position = ((eventDate.getTime() - startDateTimeline.getTime()) / 
      (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

    const prevPosition = index > 0 && timelineEvents[index - 1].date
      ? ((new Date(timelineEvents[index - 1].date).getTime() - startDateTimeline.getTime()) / 
         (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100
      : -20;

    const needsOffset = position - prevPosition < 15;

    // Calculate working days to next milestone
    const nextEvent = timelineEvents[index + 1];
    const workingDays = nextEvent?.date && event.date
      ? calculateWorkingDays(event.date, nextEvent.date)
      : null;

    return { ...event, position, needsOffset, workingDays };
  });

  return (
    <div className="mx-auto max-w-[95%]">
      <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
      <div className="relative pt-12 pb-16">
        {/* Timeline base */}
        <div className="absolute h-2 w-full bg-gray-200 rounded">
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
              className="absolute flex flex-col items-center" 
              style={{ 
                left: `${progress}%`, 
                transform: 'translateX(-50%)',
                top: '-3px'  // Position directly on the timeline
              }}
            >
              {daysMessage && (
                <div className="absolute -top-8 whitespace-nowrap text-center">
                  <div className="text-red-500 text-sm font-medium animate-pulse">
                    {daysMessage}
                  </div>
                </div>
              )}
              <div className="w-4 h-4 bg-red-500 rounded-full -mt-1 animate-pulse" />
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
              {/* Event dot and label */}
              <div
                className="absolute"
                style={{
                  left: `${event.position}%`,
                  transform: 'translateX(-50%)',
                  top: event.needsOffset ? '-24px' : '0'
                }}
              >
                <div className={`w-3 h-3 rounded-full ${
                  event.date && new Date(event.date) <= today ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div className={`absolute ${event.needsOffset ? 'top-4' : '-bottom-8'} left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs`}>
                  {`${event.label} (${event.formattedDate})`}
                </div>
              </div>

              {/* Working days between milestones */}
              {event.workingDays && index < eventPositions.length - 1 && (
                <div 
                  className="absolute text-xs text-gray-500"
                  style={{
                    left: `${(event.position + eventPositions[index + 1].position) / 2}%`,
                    transform: 'translateX(-50%)',
                    top: '-20px'
                  }}
                >
                  {event.workingDays} working days
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}