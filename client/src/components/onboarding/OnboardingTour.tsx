import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboarding, onboardingSteps } from "./OnboardingProvider";

export function OnboardingTour() {
  const { currentStep, showOnboarding, completeStep, skipOnboarding } = useOnboarding();

  if (!showOnboarding) return null;

  const currentStepData = onboardingSteps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-[400px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentStepData.title}
            </CardTitle>
            <CardDescription>
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={skipOnboarding}
            >
              Skip Tour
            </Button>
            <Button onClick={completeStep}>
              {currentStep === onboardingSteps.length - 1 ? "Finish" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
