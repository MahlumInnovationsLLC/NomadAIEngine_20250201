import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  animate?: boolean;
}

export function SkeletonText({ className, animate = true }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        "h-4 rounded-md bg-muted",
        animate && "animate-pulse",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
  );
}

export function SkeletonCard({ className, animate = true }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        "rounded-lg border bg-card p-4",
        animate && "animate-pulse",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-3">
        <SkeletonText className="w-[60%] h-6" animate={false} />
        <SkeletonText className="w-[80%]" animate={false} />
        <SkeletonText className="w-[70%]" animate={false} />
      </div>
    </motion.div>
  );
}

export function SkeletonAvatar({ className, animate = true }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        "h-12 w-12 rounded-full bg-muted",
        animate && "animate-pulse",
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    />
  );
}

export function SkeletonTable({ className, rows = 5 }: SkeletonProps & { rows?: number }) {
  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <SkeletonText className="w-[30%]" />
          <SkeletonText className="w-[40%]" />
          <SkeletonText className="w-[20%]" />
        </div>
      ))}
    </motion.div>
  );
}

export function PageSkeleton() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="space-y-2">
        <SkeletonText className="h-8 w-[50%]" />
        <SkeletonText className="h-4 w-[80%]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </motion.div>
  );
}
