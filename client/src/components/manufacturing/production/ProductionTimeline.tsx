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

  const displayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${month}/${day}/${year}`;
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
      formattedDate: event.date ? displayDate(event.date) : ''
    }));

  if (timelineEvents.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDateTimeline = timelineEvents[0]?.date
    ? new Date(timelineEvents[0].date)
    : today;

  const endDateTimeline = timelineEvents[timelineEvents.length - 1]?.date
    ? new Date(timelineEvents[timelineEvents.length - 1].date)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000);

  let todayPosition = ((today.getTime() - startDateTimeline.getTime()) /
    (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

  todayPosition = Math.max(2, Math.min(98, todayPosition));

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

    return { ...event, position: Math.max(2, Math.min(98, position)), needsOffset };
  });

  const hasShipped = project.ship && new Date(project.ship) <= today;

  const nextMilestone = timelineEvents.find(event => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    return eventDate >= today;
  });

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
    <div className="relative h-7 w-full px-1">
      <div className="absolute inset-0 flex items-center">
        {/* Base timeline */}
        <div className="relative h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          {/* Progress bar */}
          <div
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              hasShipped ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timeline events */}
        {eventPositions.map((event, index) => (
          <div
            key={`${event.type}-${index}`}
            className="absolute z-10"
            style={{ 
              left: `${event.position}%`,
              transform: 'translate(-50%, 0%)'
            }}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                event.date && new Date(event.date) <= today ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <div
              className={`absolute ${
                event.needsOffset ? 'top-3' : '-bottom-4'
              } left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-gray-500`}
            >
              {`${event.label} (${event.formattedDate})`}
            </div>
          </div>
        ))}

        {/* Current date indicator */}
        {!hasShipped && (
          <div
            className="absolute z-20"
            style={{ 
              left: `${todayPosition}%`,
              transform: 'translate(-50%, -25%)'
            }}
          >
            {daysMessage && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="text-red-500 text-[10px] font-medium animate-pulse">
                  {daysMessage}
                </div>
              </div>
            )}
            <div className="h-2 w-2 bg-red-500 rounded-full ring-1 ring-white shadow-sm animate-pulse" />
          </div>
        )}

        {/* Shipped indicator */}
        {hasShipped && (
          <div className="absolute w-full text-center -top-4">
            <span className="text-xs font-semibold text-green-500 animate-pulse">
              SHIPPED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}