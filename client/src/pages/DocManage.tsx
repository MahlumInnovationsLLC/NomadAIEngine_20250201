import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const DocManagement = lazy(() => import("./DocManagement"));
const TrainingModule = lazy(() => import("./TrainingModule"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function DocManage() {
  const [location, setLocation] = useLocation();
  const showTraining = location === "/docmanage/training";

  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage your documents, configure training modules, and control document workflows.
        </p>
        <div className="flex justify-center mb-4">
          <div className="flex gap-2 relative">
            <Button
              variant={!showTraining ? "default" : "outline"}
              onClick={() => setLocation("/docmanage")}
              className="relative z-10"
            >
              Document Management
            </Button>
            <Button
              variant={showTraining ? "default" : "outline"}
              onClick={() => setLocation("/docmanage/training")}
              className="relative z-10"
            >
              Training Progress
            </Button>
            <motion.div
              className="absolute bottom-0 h-0.5 bg-primary"
              initial={{ x: 0 }}
              animate={{ 
                x: showTraining ? "100%" : 0,
                width: "50%"
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={showTraining ? "training" : "docmanage"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              {showTraining ? <TrainingModule /> : <DocManagement />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DocManage;