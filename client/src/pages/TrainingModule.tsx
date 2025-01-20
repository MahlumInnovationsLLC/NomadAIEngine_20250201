import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Book, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrainingProgress } from "@/components/training/TrainingProgress";

interface TrainingModule {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate: string;
}

interface UserTraining {
  modules: TrainingModule[];
}

export default function TrainingModule() {
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const { data: userTraining } = useQuery<UserTraining>({
    queryKey: ['/api/training/current'],
  });

  return (
    <div className="container mx-auto">
      <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-4">Training Progress</h1>
        <p className="text-muted-foreground mb-4">
          Track your learning progress and complete training modules
        </p>
      </div>

      <div className="px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Current Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userTraining?.modules ? (
              <TrainingProgress modules={userTraining.modules} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No training modules assigned yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}