import { useEffect, useState } from 'react';
import { Project } from '@/types/manufacturing';

interface ProductionTimelineProps {
  project: Project;
}

export function ProductionTimeline({ project }: ProductionTimelineProps) {
  const [progress, setProgress] = useState(0);

  // Calculate the total duration and progress
  useEffect(() => {
    if (!project) return;

    // Find the first available start date
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

  // Filter out events with undefined dates
  const timelineEvents = [
    { date: project.fabricationStart, label: 'Fabrication Start', type: 'fab' },
    { date: project.assemblyStart, label: 'Assembly Start', type: 'assembly' },
    { date: project.wrapGraphics, label: 'Wrap/Graphics', type: 'wrap' },
    { date: project.ntcTesting, label: 'NTC Testing', type: 'ntc' },
    { date: project.qcStart, label: 'QC Start', type: 'qc' },
    { date: project.ship, label: 'Ship', type: 'ship' },
  ].filter((event): event is { date: string; label: string; type: string } => 
    typeof event.date === 'string' && event.date !== undefined
  );

  const today = new Date();

  // Find the first and last dates for timeline positioning
  const startDateTimeline = project.fabricationStart 
    ? new Date(project.fabricationStart)
    : project.assemblyStart 
    ? new Date(project.assemblyStart)
    : new Date();

  const endDateTimeline = project.ship 
    ? new Date(project.ship)
    : new Date(startDateTimeline.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if no ship date

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Production Timeline</h3>
      <div className="relative pt-8 pb-12">
        {/* Timeline base */}
        <div className="absolute h-2 w-full bg-gray-200 rounded">
          {/* Progress bar */}
          <div 
            className="absolute h-full bg-blue-500 rounded transition-all duration-1000 ease-in-out"
            style={{ width: `${progress}%` }}
          />

          {/* Current date indicator */}
          <div 
            className="absolute w-4 h-4 bg-red-500 rounded-full -mt-1 animate-pulse"
            style={{ 
              left: `${progress}%`,
              transform: 'translateX(-50%)'
            }}
          />

          {/* Timeline events */}
          {timelineEvents.map((event) => {
            const eventDate = new Date(event.date);
            const position = ((eventDate.getTime() - startDateTimeline.getTime()) / 
              (endDateTimeline.getTime() - startDateTimeline.getTime())) * 100;

            return (
              <div 
                key={event.type}
                className="absolute flex flex-col items-center"
                style={{ 
                  left: `${position}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className={`w-3 h-3 rounded-full -mt-0.5 ${
                  eventDate <= today ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div className="mt-2 text-xs font-medium whitespace-nowrap">
                  {event.label}
                </div>
                <div className="text-xs text-gray-500">
                  {eventDate.toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}