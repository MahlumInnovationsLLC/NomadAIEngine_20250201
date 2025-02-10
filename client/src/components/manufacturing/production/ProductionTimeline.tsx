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

  let todayPosition = ((today.getTime() - startDateTimeline.getTime()) /
    (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

  todayPosition = Math.max(0, Math.min(100, todayPosition));

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

    return { ...event, position: Math.max(0, Math.min(100, position)), needsOffset };
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
    <div className="relative h-6 w-full">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
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

        {/* Current date indicator */}
        {!hasShipped && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-20"
            style={{ left: `${todayPosition}%` }}
          >
            {daysMessage && (
              <div className="absolute -top-4 text-center whitespace-nowrap">
                <div className="text-red-500 text-[10px] font-medium animate-pulse">
                  {daysMessage}
                </div>
              </div>
            )}
            <div className="h-2 w-2 bg-red-500 rounded-full ring-1 ring-white ring-offset-1 animate-pulse" />
          </div>
        )}

        {/* Timeline events */}
        {eventPositions.map((event, index) => (
          <div 
            key={`${event.type}-${index}`}
            className="absolute top-1/2 -translate-y-1/2 z-10"
            style={{ left: `${event.position}%` }}
          >
            <div 
              className={`h-1.5 w-1.5 rounded-full ${
                event.date && new Date(event.date) <= today ? 'bg-green-500' : 'bg-gray-400'
              }`} 
            />
            <div 
              className={`absolute ${
                event.needsOffset ? 'top-2' : '-bottom-4'
              } left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-gray-500`}
            >
              {`${event.label} (${event.formattedDate})`}
            </div>
          </div>
        ))}

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