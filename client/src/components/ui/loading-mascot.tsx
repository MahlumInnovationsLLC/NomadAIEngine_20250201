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
    thinking: "animate-spin-slow",
    processing: "animate-spin",
    success: "animate-spin-reverse",
    error: "animate-spin-shake"
  };

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      <img
        src="/attached_assets/logo.png"
        alt="Loading indicator"
        className={cn(
          "w-full h-full object-contain",
          stateClasses[state],
          state === "thinking" && "text-blue-500",
          state === "processing" && "text-yellow-500",
          state === "success" && "text-green-500",
          state === "error" && "text-red-500"
        )}
      />
    </div>
  );
}