import { cn } from "@/lib/utils";

interface PresenceIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "online" | "away" | "offline";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function PresenceIndicator({ 
  status, 
  size = "md", 
  className,
  ...props 
}: PresenceIndicatorProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 rounded-full",
        sizeClasses[size],
        {
          "bg-green-500": status === "online",
          "bg-yellow-500": status === "away",
          "bg-gray-300": status === "offline",
        },
        className
      )}
      {...props}
    >
      {status === "online" && (
        <span className={cn(
          "absolute inset-0 rounded-full opacity-75",
          "animate-ping bg-green-400",
          sizeClasses[size]
        )} />
      )}
    </span>
  );
}