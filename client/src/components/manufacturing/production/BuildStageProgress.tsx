import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProductionLine, BuildStage } from "@/types/manufacturing";

interface BuildStageProgressProps {
  line: ProductionLine;
}

export function BuildStageProgress({ line }: BuildStageProgressProps) {
  const getStageStatusColor = (status: BuildStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'blocked':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Build Stages</h3>
        <div className="text-sm text-muted-foreground">
          Overall Progress: {Math.round(line.buildStages.reduce((acc, stage) => acc + stage.progress, 0) / line.buildStages.length)}%
        </div>
      </div>

      <div className="space-y-4">
        {line.buildStages.map((stage) => (
          <Card key={stage.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{stage.name}</CardTitle>
                <Badge variant="outline" className={getStageStatusColor(stage.status)}>
                  {stage.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {stage.description}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={stage.progress} className="flex-1" />
                  <span className="text-sm font-medium">{stage.progress}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated: {stage.estimatedDuration}min</span>
                  {stage.actualDuration && (
                    <span>Actual: {stage.actualDuration}min</span>
                  )}
                </div>
                {stage.assignedOperators.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Assigned: {stage.assignedOperators.join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {line.buildStages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No build stages defined for this production line
          </div>
        )}
      </div>
    </div>
  );
}
