import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { motion } from "framer-motion";
import { useState } from "react";

interface Module {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  completionRate: number;
  enrolled: boolean;
}

export function LearningModules() {
  const [modules] = useState<Module[]>([
    {
      id: 1,
      title: "Document Management Fundamentals",
      description: "Learn the basics of document control and management",
      category: "Document Control",
      duration: "2 hours",
      level: "Beginner",
      completionRate: 0,
      enrolled: false
    },
    {
      id: 2,
      title: "Advanced Search Techniques",
      description: "Master the art of efficient document search and retrieval",
      category: "Search Skills",
      duration: "1.5 hours",
      level: "Intermediate",
      completionRate: 0,
      enrolled: false
    },
    {
      id: 3,
      title: "Workflow Optimization",
      description: "Learn to create and optimize document workflows",
      category: "Workflow",
      duration: "3 hours",
      level: "Advanced",
      completionRate: 0,
      enrolled: false
    }
  ]);

  const getLevelColor = (level: Module['level']) => {
    switch (level) {
      case 'Beginner':
        return 'text-green-500 bg-green-50';
      case 'Intermediate':
        return 'text-blue-500 bg-blue-50';
      case 'Advanced':
        return 'text-purple-500 bg-purple-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Available Modules</h2>
          <p className="text-muted-foreground">
            Explore our curated learning paths and start your journey
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <FontAwesomeIcon icon="fa-filter" className="h-4 w-4" />
          Filter Modules
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="border-b bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getLevelColor(module.level)}`}>
                      {module.level}
                    </span>
                  </div>
                  <FontAwesomeIcon 
                    icon={module.enrolled ? "fa-bookmark" : "fa-bookmark-o"} 
                    className="h-5 w-5 text-primary cursor-pointer"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon="fa-clock-o" className="h-4 w-4 text-muted-foreground" />
                      {module.duration}
                    </span>
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon="fa-folder-o" className="h-4 w-4 text-muted-foreground" />
                      {module.category}
                    </span>
                  </div>

                  {module.enrolled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{module.completionRate}%</span>
                      </div>
                      <Progress value={module.completionRate} className="h-2" />
                    </div>
                  )}

                  <Button 
                    className="w-full"
                    variant={module.enrolled ? "secondary" : "default"}
                  >
                    {module.enrolled ? "Continue Learning" : "Start Module"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}