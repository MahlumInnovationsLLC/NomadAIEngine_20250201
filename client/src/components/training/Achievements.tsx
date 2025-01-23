import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { motion } from "framer-motion";
import { useState } from "react";

interface Achievement {
  id: number;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlocked: boolean;
}

export function Achievements() {
  const [achievements] = useState<Achievement[]>([
    {
      id: 1,
      title: "Quick Learner",
      description: "Complete your first training module",
      progress: 1,
      maxProgress: 1,
      icon: "fa-graduation-cap",
      rarity: "Common",
      unlocked: true
    },
    {
      id: 2,
      title: "Knowledge Seeker",
      description: "Complete 5 different training modules",
      progress: 2,
      maxProgress: 5,
      icon: "fa-book-open-reader",
      rarity: "Rare",
      unlocked: false
    },
    {
      id: 3,
      title: "Document Master",
      description: "Achieve 100% in all document management modules",
      progress: 3,
      maxProgress: 10,
      icon: "fa-crown",
      rarity: "Epic",
      unlocked: false
    },
    {
      id: 4,
      title: "Training Legend",
      description: "Complete all available training modules",
      progress: 15,
      maxProgress: 20,
      icon: "fa-trophy",
      rarity: "Legendary",
      unlocked: false
    }
  ]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'Common':
        return 'from-gray-400 to-gray-500';
      case 'Rare':
        return 'from-blue-400 to-blue-500';
      case 'Epic':
        return 'from-purple-400 to-purple-500';
      case 'Legendary':
        return 'from-yellow-400 to-yellow-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Achievements</h2>
        <p className="text-muted-foreground">
          Track your progress and unlock special achievements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`overflow-hidden ${!achievement.unlocked && 'opacity-75'}`}>
              <div className={`h-2 bg-gradient-to-r ${getRarityColor(achievement.rarity)}`} />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${getRarityColor(achievement.rarity)} bg-opacity-10`}>
                    <FontAwesomeIcon 
                      icon={achievement.icon} 
                      className={`h-6 w-6 text-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {achievement.title}
                      <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                        {achievement.rarity}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{achievement.progress} / {achievement.maxProgress}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}