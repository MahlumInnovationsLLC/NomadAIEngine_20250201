import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faMedal,
  faAward,
  faFireFlameCurved,
  faChartLine,
  faStopwatch,
  faPersonRunning,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Milestone {
  id: string;
  name: string;
  description: string;
  type: "workout" | "nutrition" | "health" | "progress" | "consistency";
  progress: number;
  target: number;
  unit: string;
  isCompleted: boolean;
  completedAt?: string;
}

// Mock data for demonstration
const mockMilestones: Milestone[] = [
  {
    id: "1",
    name: "Workout Warrior",
    description: "Complete 20 workouts",
    type: "workout",
    progress: 15,
    target: 20,
    unit: "workouts",
    isCompleted: false,
  },
  {
    id: "2",
    name: "Protein Champion",
    description: "Hit protein goals for 30 days",
    type: "nutrition",
    progress: 30,
    target: 30,
    unit: "days",
    isCompleted: true,
    completedAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Consistency King",
    description: "Log in for 14 consecutive days",
    type: "consistency",
    progress: 10,
    target: 14,
    unit: "days",
    isCompleted: false,
  },
  {
    id: "4",
    name: "Strength Milestone",
    description: "Increase strength by 25%",
    type: "progress",
    progress: 20,
    target: 25,
    unit: "%",
    isCompleted: false,
  },
];

function getTypeIcon(type: Milestone["type"]) {
  switch (type) {
    case "workout":
      return faPersonRunning;
    case "nutrition":
      return faFireFlameCurved;
    case "health":
      return faMedal;
    case "progress":
      return faChartLine;
    case "consistency":
      return faStopwatch;
    default:
      return faTrophy;
  }
}

export function MilestoneTracker() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedMilestone, setCelebratedMilestone] = useState<Milestone | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);

  useEffect(() => {
    // Check for newly completed milestones
    const newlyCompleted = milestones.find(
      (m) => !m.isCompleted && m.progress >= m.target
    );

    if (newlyCompleted) {
      setCelebratedMilestone(newlyCompleted);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [milestones]);

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} className="h-5 w-5 text-yellow-500" />
              Fitness Milestones
            </CardTitle>
            <Badge variant="secondary" className="animate-pulse">
              {milestones.filter((m) => m.isCompleted).length} Achieved
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`p-4 border rounded-lg space-y-3 relative ${
                  milestone.isCompleted ? "bg-muted/50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={getTypeIcon(milestone.type)}
                      className={`h-4 w-4 ${
                        milestone.isCompleted ? "text-green-500" : "text-blue-500"
                      }`}
                    />
                    <div>
                      <h3 className="font-medium">{milestone.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  {milestone.isCompleted && (
                    <Badge variant="success" className="ml-2">
                      Completed
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {milestone.progress} / {milestone.target} {milestone.unit}
                    </span>
                  </div>
                  <Progress
                    value={(milestone.progress / milestone.target) * 100}
                    className={milestone.isCompleted ? "bg-green-100" : ""}
                  />
                </div>

                {milestone.completedAt && (
                  <p className="text-sm text-muted-foreground">
                    Completed on {new Date(milestone.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4">
            <Button className="flex-1 gap-2">
              <FontAwesomeIcon icon={faAward} className="h-4 w-4" />
              View All Achievements
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
              Track Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showCelebration && celebratedMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Card className="w-96 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1 }}
                  >
                    <FontAwesomeIcon
                      icon={faTrophy}
                      className="h-12 w-12 text-yellow-500"
                    />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl">
                      Congratulations! 🎉
                    </h3>
                    <p className="text-muted-foreground">
                      You've achieved the "{celebratedMilestone.name}" milestone!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
