import * as React from "react";
import { cn } from "@/lib/utils";

interface TreeProps {
  children?: React.ReactNode;
  className?: string;
}

interface TreeNodeProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Tree({ children, className }: TreeProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

export function TreeNode({ id, label, icon, children, onClick }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleClick = () => {
    if (children) {
      setIsExpanded(!isExpanded);
    }
    onClick?.();
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center p-2 rounded-lg hover:bg-accent",
          (onClick || children) && "cursor-pointer"
        )}
        onClick={handleClick}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="flex-1 text-sm">{label}</span>
      </div>
      {isExpanded && children && (
        <div className="ml-6 mt-1 space-y-1">{children}</div>
      )}
    </div>
  );
}