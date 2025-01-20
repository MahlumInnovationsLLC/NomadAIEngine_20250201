import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface ModuleCardProps {
  moduleId: string;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  isLocked?: boolean;
  requiredLevel?: number;
  onStart: () => void;
}

export function ModuleCard({
  moduleId,
  title,
  description,
  totalLessons,
  completedLessons,
  isLocked,
  requiredLevel,
  onStart
}: ModuleCardProps) {
  const progress = Math.round((completedLessons / totalLessons) * 100);
  const isCompleted = completedLessons === totalLessons;

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon="book" className="h-5 w-5" />
            {title}
          </CardTitle>
          {isCompleted && (
            <Badge variant="success" className="bg-green-500">
              <FontAwesomeIcon icon="check-circle" className="h-4 w-4 mr-1" />
              Completed
            </Badge>
          )}
          {isLocked && (
            <Badge variant="secondary" className="bg-gray-500">
              <FontAwesomeIcon icon="lock" className="h-4 w-4 mr-1" />
              Level {requiredLevel} Required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </div>
        </div>
        <Button
          className="w-full mt-4"
          disabled={isLocked}
          onClick={onStart}
        >
          {isCompleted ? 'Review Module' : 'Start Module'}
        </Button>
      </CardContent>
    </Card>
  );
}