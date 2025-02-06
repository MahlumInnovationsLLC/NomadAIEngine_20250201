import React, { useState, useEffect } from 'react';

interface Project {
  startDate: string;
  endDate: string;
  shipDate?: string;
  name: string;
}

interface TimelineEvent {
  type: 'start' | 'end' | 'ship';
  date: string;
  position: number;
}


function ProductionTimeline({ project }: { project: Project }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!project || !project.startDate || !project.endDate) return;

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const calculatedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    setProgress(calculatedProgress);
  }, [project]);

  if (!project) return null;

  const isValidDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0); // Normalize to start of day
    return date instanceof Date && !isNaN(date.getTime());
  };

  const getShipStatus = (shipDate?: string) => {
    if (!shipDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ship = new Date(shipDate);
    ship.setHours(0, 0, 0, 0);

    if (ship.getTime() === today.getTime()) {
      return 'SHIPPING TODAY';
    } else if (ship.getTime() < today.getTime()) {
      return 'SHIPPED';
    }
    return '';
  };

  const events: TimelineEvent[] = [];
  if (isValidDate(project.startDate)) {
    events.push({ type: 'start', date: project.startDate, position: 0 });
  }
  if (isValidDate(project.endDate)) {
    events.push({ type: 'end', date: project.endDate, position: 100 });
  }
  if (isValidDate(project.shipDate)) {
    events.push({ type: 'ship', date: project.shipDate, position: progress });
  }


  return (
    <div className="relative w-full h-12 bg-gray-200 rounded-full overflow-hidden">
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-full bg-blue-500"
        style={{ width: `${progress}%` }}
      />

      {/* Timeline events */}
      {events.map((event) => (
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
              event.date && new Date(event.date).setHours(0,0,0,0) <= today.setHours(0,0,0,0) ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {/* Show shipping status if this is a ship event */}
            {event.type === 'ship' && event.date && (
              <div className="absolute -top-6 whitespace-nowrap text-sm font-medium text-blue-500">
                {getShipStatus(event.date)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductionTimeline;