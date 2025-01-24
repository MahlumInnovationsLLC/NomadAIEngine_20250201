import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMedal,
  faTrophy,
  faAward,
  faStar,
  faFire,
  faHeartPulse,
  faDumbbell,
  faPersonRunning,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  progress: number;
  unlocked: boolean;
  category: "fitness" | "nutrition" | "wellness" | "consistency";
  color: string;
  requirement: string;
  dateEarned?: string;
}

// Mock achievements data
const mockAchievements: Achievement[] = [
  {
    id: "1",
    name: "Fitness Warrior",
    description: "Complete 10 workouts in a month",
    icon: faDumbbell,
    progress: 100,
    unlocked: true,
    category: "fitness",
    color: "text-blue-500",
    requirement: "10 workouts",
    dateEarned: "2025-01-20"
  },
  {
    id: "2",
    name: "Consistency King",
    description: "Log in for 7 consecutive days",
    icon: faFire,
    progress: 85,
    unlocked: false,
    category: "consistency",
    color: "text-orange-500",
    requirement: "7 days streak"
  },
  {
    id: "3",
    name: "Health Champion",
    description: "Maintain heart rate zones during workouts",
    icon: faHeartPulse,
    progress: 60,
    unlocked: false,
    category: "wellness",
    color: "text-red-500",
    requirement: "5 optimal workouts"
  },
  {
    id: "4",
    name: "Marathon Milestone",
    description: "Run a total of 42.2 km",
    icon: faPersonRunning,
    progress: 100,
    unlocked: true,
    category: "fitness",
    color: "text-green-500",
    requirement: "42.2 km total",
    dateEarned: "2025-01-15"
  }
];

export function AchievementBadges() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const badgeVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      rotate: [0, -10, 10, -10, 0],
      transition: { 
        duration: 0.3
      }
    }
  };

  const celebrationVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: [1, 1.2, 1],
      opacity: [0, 1, 0],
      transition: {
        duration: 1.5,
        times: [0, 0.5, 1]
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} className="h-5 w-5 text-yellow-500" />
            Wellness Achievements
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            4 Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {mockAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative p-4 border rounded-lg cursor-pointer transition-colors ${
                achievement.unlocked ? "bg-muted/50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-muted ${achievement.color}`}>
                    <FontAwesomeIcon
                      icon={achievement.icon}
                      className="h-4 w-4"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {achievement.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <FontAwesomeIcon
                      icon={faMedal}
                      className="h-6 w-6 text-yellow-500"
                    />
                  </motion.div>
                )}
              </div>

              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{achievement.progress}%</span>
                </div>
                <Progress 
                  value={achievement.progress}
                  className={`${
                    achievement.unlocked ? "bg-yellow-100" : ""
                  }`}
                />
              </div>

              <div className="mt-2 flex justify-between items-center text-sm text-muted-foreground">
                <span>{achievement.requirement}</span>
                {achievement.dateEarned && (
                  <span>Earned {new Date(achievement.dateEarned).toLocaleDateString()}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showCelebration && (
            <motion.div
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-6xl">🎉</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between gap-4">
          <Button 
            className="flex-1 gap-2"
            onClick={() => setShowCelebration(true)}
          >
            <FontAwesomeIcon icon={faStar} className="h-4 w-4" />
            View All Achievements
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <FontAwesomeIcon icon={faAward} className="h-4 w-4" />
            Achievement Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
