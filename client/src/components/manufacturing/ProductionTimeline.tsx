import { useEffect, useState } from 'react';
import { Project } from '@/types/manufacturing';

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

    // Adjust dates to local timezone to prevent off-by-one issues
    startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
    endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasShipped = project.ship && new Date(project.ship) <= today;

  // Only include events with valid dates
  const timelineEvents = [
    { date: project.fabricationStart, label: 'Fabrication Start', type: 'fab' },
    { date: project.assemblyStart, label: 'Assembly Start', type: 'assembly' },
    { date: project.wrapGraphics, label: 'Wrap/Graphics', type: 'wrap' },
    { date: project.ntcTesting, label: 'NTC Testing', type: 'ntc' },
    { date: project.qcStart, label: 'QC Start', type: 'qc' },
    { date: project.ship, label: 'Ship', type: 'ship' },
  ].filter(event => isValidDate(event.date));

  // If no valid events, don't render timeline
  if (timelineEvents.length === 0) return null;

  const startDateTimeline = timelineEvents[0]?.date 
    ? new Date(timelineEvents[0].date)
    : today;

  const endDateTimeline = timelineEvents[timelineEvents.length - 1]?.date
    ? new Date(timelineEvents[timelineEvents.length - 1].date)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Calculate milestone positions and detect overlaps
  const eventPositions = timelineEvents.map((event, index) => {
    if (!event.date) return { ...event, position: 0, needsOffset: false };

    const eventDate = new Date(event.date);
    eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());

    const position = ((eventDate.getTime() - startDateTimeline.getTime()) / 
      (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

    // Check if this position is too close to the previous milestone
    const prevPosition = index > 0 && timelineEvents[index - 1].date
      ? ((new Date(timelineEvents[index - 1].date).getTime() - startDateTimeline.getTime()) / 
         (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100
      : -20;

    const needsOffset = position - prevPosition < 15;

    return { ...event, position, needsOffset };
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
                {`${event.label} (${event.date ? new Date(event.date).toLocaleDateString() : ''})`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}