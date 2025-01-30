import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpBubbleProps {
  content: string | ReactNode;
  children?: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  showIcon?: boolean;
}

export function HelpBubble({ 
  content, 
  children, 
  className, 
  side = "right",
  showIcon = true 
}: HelpBubbleProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-1", className)}>
            {children}
            {showIcon && <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[300px] text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}