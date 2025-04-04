import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "connected" | "disconnected" | "error" | "disabled";
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          {
            "bg-green-500 animate-pulse": status === "connected",
            "bg-red-500": status === "disconnected" || status === "error",
            "bg-gray-400": status === "disabled",
          }
        )}
      />
      {label && (
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}