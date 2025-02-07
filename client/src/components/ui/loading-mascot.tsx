import { cn } from "@/lib/utils";
import React from "react";

interface LoadingMascotProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  state?: "thinking" | "processing" | "success" | "error";
}

export function LoadingMascot({
  className,
  size = "md",
  state = "thinking"
}: LoadingMascotProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const stateClasses = {
    thinking: "animate-bounce",
    processing: "animate-spin",
    success: "animate-pulse",
    error: "animate-shake"
  };

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      {/* Simple robot mascot SVG */}
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "fill-current",
          stateClasses[state],
          state === "thinking" && "text-blue-500",
          state === "processing" && "text-yellow-500",
          state === "success" && "text-green-500",
          state === "error" && "text-red-500"
        )}
      >
        {/* Robot head */}
        <path d="M12 2a7 7 0 00-7 7v6a7 7 0 0014 0V9a7 7 0 00-7-7zm0 2a5 5 0 015 5v6a5 5 0 01-10 0V9a5 5 0 015-5z" />
        {/* Robot eyes */}
        <circle cx="9" cy="10" r="1.5" />
        <circle cx="15" cy="10" r="1.5" />
        {/* Robot mouth - changes based on state */}
        {state === "thinking" && (
          <path d="M9 14h6" strokeWidth="2" className="stroke-current" fill="none" />
        )}
        {state === "processing" && (
          <path d="M9 14h6" strokeWidth="2" className="stroke-current" fill="none" />
        )}
        {state === "success" && (
          <path d="M8 14c2 1 4 1 8 0" strokeWidth="2" className="stroke-current" fill="none" />
        )}
        {state === "error" && (
          <path d="M16 14c-2-1-4-1-8 0" strokeWidth="2" className="stroke-current" fill="none" />
        )}
      </svg>
    </div>
  );
}
