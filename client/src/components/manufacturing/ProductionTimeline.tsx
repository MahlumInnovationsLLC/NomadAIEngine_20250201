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
    { date: project.ship, label: 'Ship', type: 'ship' },
  ].filter(event => isValidDate(event.date));

  // If no valid events, don't render timeline
  if (timelineEvents.length === 0) return null;

  const today = new Date();
  const startDateTimeline = timelineEvents[0]?.date 
    ? new Date(timelineEvents[0].date)
    : new Date();

  const endDateTimeline = timelineEvents[timelineEvents.length - 1]?.date
    ? new Date(timelineEvents[timelineEvents.length - 1].date)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Calculate milestone positions and detect overlaps
  const eventPositions = timelineEvents.map((event, index) => {
    const eventDate = new Date(event.date);
    const position = ((eventDate.getTime() - startDateTimeline.getTime()) / 
      (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

    // Check if this position is too close to the previous milestone
    const prevPosition = index > 0 ? ((new Date(timelineEvents[index - 1].date).getTime() - startDateTimeline.getTime()) / 
      (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100 : -20;

    const needsOffset = position - prevPosition < 15; // If milestones are less than 15% apart

    return { ...event, position, needsOffset };
  });

  const calculateDaysBetween = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Find next upcoming milestone
  const nextMilestone = timelineEvents.find(event => new Date(event.date) > today);
  const daysUntilNext = nextMilestone 
    ? calculateDaysBetween(today.toISOString(), nextMilestone.date)
    : null;

  return (
    <div className="mx-auto max-w-[95%]"> {/* Container to keep content within boundaries */}
      <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
      <div className="relative pt-12 pb-16"> {/* Increased padding to accommodate all content */}
        {/* Timeline base */}
        <div className="absolute h-2 w-full bg-gray-200 rounded">
          {/* Progress bar */}
          <div 
            className="absolute h-full bg-blue-500 rounded transition-all duration-1000 ease-in-out"
            style={{ width: `${progress}%` }}
          />

          {/* Current date indicator with days until next milestone */}
          <div className="absolute" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}>
            {daysUntilNext && (
              <div className="absolute -top-10 whitespace-nowrap text-center">
                <div className="text-red-500 text-sm font-medium animate-pulse">
                  {daysUntilNext} days until {nextMilestone?.label}
                </div>
              </div>
            )}
            <div className="w-4 h-4 bg-red-500 rounded-full -mt-1 animate-pulse" />
          </div>

          {/* Timeline events */}
          {eventPositions.map((event, index) => {
            // Calculate days to next milestone
            const nextEvent = timelineEvents[index + 1];
            const daysToNext = nextEvent ? calculateDaysBetween(event.date, nextEvent.date) : null;
            const nextPosition = nextEvent
              ? ((new Date(nextEvent.date).getTime() - startDateTimeline.getTime()) /
                 (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100
              : event.position;

            return (
              <div key={event.type}>
                {/* Event dot */}
                <div 
                  className="absolute flex flex-col items-center"
                  style={{ 
                    left: `${event.position}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* The dot */}
                  <div className={`w-3 h-3 rounded-full -mt-0.5 ${
                    new Date(event.date) <= today ? 'bg-green-500' : 'bg-gray-400'
                  }`} />

                  {/* Connecting line for offset labels */}
                  {event.needsOffset && (
                    <div 
                      className="w-px bg-gray-300"
                      style={{
                        height: '1rem',
                        transform: 'translateY(2px)'
                      }}
                    />
                  )}

                  {/* Label container with improved boundary handling */}
                  <div 
                    className={`absolute whitespace-nowrap ${
                      event.position < 10 ? 'origin-left left-0 translate-x-0' :
                      event.position > 90 ? 'origin-right right-0 translate-x-0' :
                      'transform -translate-x-1/2'
                    }`}
                    style={{
                      top: event.needsOffset ? '1.5rem' : '0.75rem',
                      left: event.position < 10 || event.position > 90 ? 'auto' : `${event.position}%`
                    }}
                  >
                    <div className="text-xs font-medium">
                      {event.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Days between milestones */}
                {daysToNext && (
                  <div 
                    className="absolute text-xs text-gray-500"
                    style={{
                      left: `${(event.position + nextPosition) / 2}%`,
                      transform: 'translateX(-50%)',
                      marginTop: '-1rem'
                    }}
                  >
                    {daysToNext} days
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}