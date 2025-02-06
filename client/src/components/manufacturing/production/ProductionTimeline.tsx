
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

  // Only include events with valid dates
  const timelineEvents = [
    { date: project.fabricationStart, label: 'Fabrication Start', type: 'fab' },
    { date: project.assemblyStart, label: 'Assembly Start', type: 'assembly' },
    { date: project.wrapGraphics, label: 'Wrap/Graphics', type: 'wrap' },
    { date: project.ntcTesting, label: 'NTC Testing', type: 'ntc' },
    { date: project.qcStart, label: 'QC Start', type: 'qc' },
    { 
      date: project.ship, 
      label: isShipped(project.ship) ? 'SHIPPED' : 'Ship', 
      type: 'ship' 
    },
  ].filter(event => isValidDate(event.date));

  function isShipped(dateStr?: string): boolean {
    if (!dateStr) return false;
    const shipDate = new Date(dateStr);
    const today = new Date();
    shipDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today > shipDate;
  }

  // If no valid events, don't render timeline
  if (timelineEvents.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const startDateTimeline = timelineEvents[0]?.date 
    ? new Date(timelineEvents[0].date)
    : new Date();

  const endDateTimeline = timelineEvents[timelineEvents.length - 1]?.date
    ? new Date(timelineEvents[timelineEvents.length - 1].date)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Calculate milestone positions and detect overlaps
  const eventPositions = timelineEvents.map((event, index) => {
    if (!event.date) return { ...event, position: 0, needsOffset: false };

    const eventDate = new Date(event.date);
    const position = ((eventDate.getTime() - startDateTimeline.getTime()) / 
      (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

    // Check if this position is too close to the previous milestone
    const prevPosition = index > 0 && timelineEvents[index - 1].date
      ? ((new Date(timelineEvents[index - 1].date).getTime() - startDateTimeline.getTime()) / 
         (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100
      : -20;

    const needsOffset = position - prevPosition < 15; // If milestones are less than 15% apart

    return { ...event, position, needsOffset };
  });

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Find next upcoming milestone
  const nextMilestone = timelineEvents.find(event => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0); // Normalize to start of day
    return eventDate >= today;
  });

  // Calculate days message
  let daysMessage = '';
  if (project.ship) {
    const shipDate = new Date(project.ship);
    shipDate.setHours(0, 0, 0, 0); // Normalize to start of day
    const todayNormalized = new Date();
    todayNormalized.setHours(0, 0, 0, 0); // Normalize today to start of day
    
    const shipDateStr = shipDate.toISOString().split('T')[0];
    const todayStr = todayNormalized.toISOString().split('T')[0];
    
    if (shipDateStr === todayStr) {
      daysMessage = 'SHIPPING TODAY';
    } else if (todayStr > shipDateStr) {
      daysMessage = 'SHIPPED';
    } else {
      const diffTime = shipDate.getTime() - todayNormalized.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysMessage = `${diffDays} days until shipping`;
    }
  }

  return (
    <div className="mx-auto max-w-[95%]">
      <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
      <div className="relative pt-12 pb-16">
        {/* Timeline base */}
        <div className="absolute h-2 w-full bg-gray-200 rounded">
          {/* Progress bar */}
          <div 
            className="absolute h-full bg-blue-500 rounded transition-all duration-1000 ease-in-out"
            style={{ width: `${progress}%` }}
          />

          {/* Current date indicator with shipping status */}
          <div className="absolute" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}>
            {daysMessage && (
              <div className="absolute -top-10 whitespace-nowrap text-center">
                <div className="text-red-500 text-sm font-medium animate-pulse">
                  {daysMessage}
                </div>
              </div>
            )}
            <div className="w-4 h-4 bg-red-500 rounded-full -mt-1 animate-pulse" />
          </div>

          {/* Timeline events */}
          {eventPositions.map((event, index) => (
            <div
              key={`${event.type}-${index}`}
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
                {event.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
