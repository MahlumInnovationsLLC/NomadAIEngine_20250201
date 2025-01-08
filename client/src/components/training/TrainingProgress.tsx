import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

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

export function TrainingProgress({ modules }: TrainingProgressProps) {
  const totalProgress = modules.length > 0
    ? (modules.filter(m => m.status === 'completed').length / modules.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress Circle */}
      <div className="flex justify-center">
        <motion.div 
          className="relative w-32 h-32"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-muted stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <motion.circle
              className="text-primary stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251.2" }}
              animate={{ 
                strokeDasharray: `${totalProgress * 2.512} 251.2`
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(totalProgress)}%</span>
          </div>
        </motion.div>
      </div>

      {/* Training Timeline */}
      <div className="space-y-4">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {module.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : module.status === 'in_progress' ? (
                  <Clock className="w-6 h-6 text-blue-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
                
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
                    <Progress 
                      value={module.progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{module.progress}% complete</span>
                      <span>Due: {new Date(module.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
