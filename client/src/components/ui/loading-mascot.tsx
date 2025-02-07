import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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
    thinking: "animate-spin-slow text-primary",
    processing: "animate-spin text-yellow-500",
    success: "animate-spin-reverse text-green-500",
    error: "animate-spin-shake text-red-500"
  };

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      <FontAwesomeIcon
        icon={["fal", "brain-circuit"]}
        className={cn(
          "w-full h-full",
          stateClasses[state]
        )}
      />
    </div>
  );
}