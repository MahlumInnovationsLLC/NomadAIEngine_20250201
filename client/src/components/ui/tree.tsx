import * as React from "react";
import { cn } from "@/lib/utils";

interface TreeProps {
  children?: React.ReactNode;
  onNodeSelect?: (node: string) => void;
  className?: string;
}

interface TreeNodeProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Tree({ children, onNodeSelect, className }: TreeProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

export function TreeNode({ id, label, icon, children }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div>
      <div
        className={cn(
          "flex items-center p-2 rounded-lg cursor-pointer hover:bg-accent",
          children && "cursor-pointer"
        )}
        onClick={() => children && setIsExpanded(!isExpanded)}
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
