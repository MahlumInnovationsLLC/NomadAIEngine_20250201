import React, { useEffect, useState } from 'react';

// Define the GanttMilestone interface directly to avoid import issues
interface GanttMilestone {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  projectId: string;
  projectName: string;
  editable?: boolean;
  deletable?: boolean;
  dependencies?: string[];
  duration: number;
  indent: number;
  parent?: string;
  completed: number;
  isExpanded?: boolean;
  key?: string;
}

interface GanttDependencyArrowsProps {
  milestones: GanttMilestone[];
  timeScale: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function GanttDependencyArrows({ 
  milestones, 
  timeScale, 
  containerRef 
}: GanttDependencyArrowsProps) {
  const [arrows, setArrows] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    if (!containerRef.current || !milestones.length) return;
    
    const calculateArrows = () => {
      const milestonesWithDependencies = milestones.filter(m => m.dependencies && m.dependencies.length > 0);
      const newArrows: JSX.Element[] = [];
      
      milestonesWithDependencies.forEach(milestone => {
        milestone.dependencies?.forEach((dependencyId: string) => {
          const dependencyMilestone = milestones.find(m => m.id === dependencyId);
          if (!dependencyMilestone) return;
          
          // Find the corresponding DOM elements
          const sourceElement = document.getElementById(`milestone-${dependencyMilestone.id}`);
          const targetElement = document.getElementById(`milestone-${milestone.id}`);
          
          if (!sourceElement || !targetElement) return;
          
          // Get the positions relative to the container
          const containerRect = containerRef.current!.getBoundingClientRect();
          const sourceRect = sourceElement.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          
          const sourceX = sourceRect.right - containerRect.left;
          const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
          
          const targetX = targetRect.left - containerRect.left;
          const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
          
          const controlPointOffset = Math.min(80, Math.max((targetX - sourceX) / 2, 20));
          
          const path = `M ${sourceX} ${sourceY} 
                        C ${sourceX + controlPointOffset} ${sourceY}, 
                          ${targetX - controlPointOffset} ${targetY}, 
                          ${targetX} ${targetY}`;
          
          const arrow = (
            <path
              key={`${dependencyMilestone.id}-${milestone.id}`}
              d={path}
              fill="none"
              stroke="#888"
              strokeWidth="1.5"
              className="connector-line"
              markerEnd="url(#arrow)"
            />
          );
          
          newArrows.push(arrow);
        });
      });
      
      setArrows(newArrows);
    };
    
    // Add a small delay to ensure the DOM elements have rendered
    const timerId = setTimeout(calculateArrows, 100);
    
    // Recalculate when any of these dependencies change
    window.addEventListener('resize', calculateArrows);
    
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', calculateArrows);
    };
  }, [milestones, timeScale, containerRef]);
  
  return (
    <svg 
      className="gantt-dependency-arrows" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        overflow: 'visible'
      }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
        </marker>
      </defs>
      {arrows}
    </svg>
  );
}

export default GanttDependencyArrows;