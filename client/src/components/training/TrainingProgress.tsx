import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lazy, Suspense } from "react";
import { 
  Award, 
  ChalkboardTeacher, 
  Circle,
  Trophy
} from "lucide-react";

interface TrainingModule {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  dueDate: string;
}

interface TrainingProgressProps {
  modules: TrainingModule[];
}

const StatusIcon = ({ status }: { status: TrainingModule['status'] }) => {
  switch (status) {
    case 'completed':
      return <Award className="h-5 w-5 text-green-500 mr-2" />;
    case 'in_progress':
      return <ChalkboardTeacher className="h-5 w-5 text-blue-500 mr-2" />;
    case 'not_started':
      return <Circle className="h-5 w-5 text-gray-400 mr-2" />;
  }
};

export function TrainingProgress({ modules }: TrainingProgressProps) {
  const totalProgress = modules.length > 0
    ? (modules.filter(m => m.status === 'completed').length / modules.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Current Progress</h2>
        <Trophy className="h-6 w-6 text-yellow-500" />
      </div>

      <div className="flex justify-center mb-8">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 flex items-center justify-center">
            <Progress value={totalProgress} className="w-32 h-32 rounded-full" />
            <span className="absolute text-2xl font-bold">{Math.round(totalProgress)}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="opacity-100 transform translate-x-0">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <StatusIcon status={module.status} />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{module.title}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      module.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : module.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {module.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Progress value={module.progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{module.progress}% complete</span>
                      <span>Due: {new Date(module.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}