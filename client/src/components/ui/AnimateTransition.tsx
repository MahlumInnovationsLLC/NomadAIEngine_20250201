import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ErrorBoundary from "./ErrorBoundary";

interface AnimateTransitionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Animation variants: 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right'
   */
  variant?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  /**
   * Optional delay in seconds
   */
  delay?: number;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  'slide-down': {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
};

export function AnimateTransition({ 
  children, 
  className, 
  variant = 'fade',
  delay = 0 
}: AnimateTransitionProps) {
  return (
    <ErrorBoundary>
      <motion.div
        className={cn("w-full", className)}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[variant]}
        transition={{ 
          duration: 0.2,
          ease: "easeOut",
          delay 
        }}
      >
        {children}
      </motion.div>
    </ErrorBoundary>
  );
}

export function AnimatePresenceWrapper({ 
  children, 
  mode = "wait" 
}: { 
  children: React.ReactNode;
  mode?: "wait" | "sync" | "popLayout";
}) {
  return (
    <ErrorBoundary>
      <AnimatePresence mode={mode}>
        {children}
      </AnimatePresence>
    </ErrorBoundary>
  );
}