import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faDumbbell, 
  faBrain, 
  faGears,
  faCheckCircle 
} from "@fortawesome/free-solid-svg-icons";

interface WorkoutGenerationLoaderProps {
  currentStep: number;
}

const steps = [
  { icon: faBrain, label: "Analyzing fitness profile..." },
  { icon: faGears, label: "Optimizing exercises..." },
  { icon: faDumbbell, label: "Building your plan..." },
  { icon: faCheckCircle, label: "Finalizing workout..." }
];

export function WorkoutGenerationLoader({ currentStep }: WorkoutGenerationLoaderProps) {
  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      {/* Dumbbell animation */}
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 20, -20, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <FontAwesomeIcon 
          icon={faDumbbell} 
          className="h-16 w-16 text-primary"
        />
      </motion.div>

      {/* Progress steps */}
      <div className="w-full max-w-md space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: currentStep >= index ? 1 : 0,
                opacity: currentStep >= index ? 1 : 0.3
              }}
              className="flex-shrink-0"
            >
              <FontAwesomeIcon 
                icon={step.icon} 
                className={`h-6 w-6 ${
                  currentStep >= index ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </motion.div>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ 
                width: currentStep >= index ? "100%" : "0%"
              }}
              className="h-1 bg-primary rounded-full"
              transition={{ duration: 0.5 }}
            />
            <span className={`text-sm ${
              currentStep >= index ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
