import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

interface TrainingModule {
  id: string;
  name: string;
  completedLessons: number;
  totalLessons: number;
}

interface Activity {
  id: string;
  description: string;
  timestamp: string;
}

interface TrainingData {
  currentLevel: number;
  modules: TrainingModule[];
  recentActivity: Activity[];
}

export default function TrainingModule() {
  const { data: trainingData } = useQuery<TrainingData>({
    queryKey: ['/api/training/progress'],
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Role Level */}
            <div>
              <h3 className="text-lg font-medium mb-2">Current Role Level</h3>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Award className="h-6 w-6 text-primary" />
                <span>Level {trainingData?.currentLevel ?? 1}</span>
              </div>
            </div>

            {/* Training Progress */}
            <div>
              <h3 className="text-lg font-medium mb-4">Training Modules</h3>
              <div className="space-y-4">
                {trainingData?.modules?.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{module.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {module.completedLessons}/{module.totalLessons} Completed
                      </span>
                    </div>
                    <Progress value={(module.completedLessons / module.totalLessons) * 100} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {trainingData?.recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.description}</span>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}