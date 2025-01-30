import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProductionLine, BuildStage } from "@/types/manufacturing";
import { AlertCircle, Plus } from "lucide-react";
import { AddProductionLineForm } from "./AddProductionLineForm";
import { BuildStageProgress } from "./BuildStageProgress";

export default function ProductionLinesGrid() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);

  const { data: productionLines = [], isLoading, error } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: ProductionLine['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10 text-green-500';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'error':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-500';
      case 'high':
        return 'bg-orange-500/10 text-orange-500';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'low':
        return 'bg-green-500/10 text-green-500';
    }
  };

  const calculateOverallProgress = (stages: BuildStage[]) => {
    if (!stages?.length) return 0;
    return (stages.reduce((acc, stage) => acc + stage.progress, 0) / stages.length);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load production lines. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Production Lines</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Production Line
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productionLines.map((line) => (
          <Card 
            key={line.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setSelectedLine(line)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{line.name}</span>
                <Badge variant="outline" className={getStatusColor(line.status)}>
                  {line.status}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{line.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {line.currentOrder && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Order</span>
                      <Badge variant="outline" className={getPriorityColor(line.currentOrder.priority)}>
                        {line.currentOrder.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">{line.currentOrder.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        Order #{line.currentOrder.orderNumber}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{calculateOverallProgress(line.buildStages).toFixed(1)}%</span>
                      </div>
                      <Progress value={calculateOverallProgress(line.buildStages)} className="h-2" />
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span>Capacity</span>
                  <span>
                    {line.capacity?.actual ?? 0}/{line.capacity?.planned ?? 0} {line.capacity?.unit ?? 'units/hour'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>OEE</span>
                  <span>{(line.performance?.oee ?? 0).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {productionLines.length === 0 && (
          <Card className="col-span-full p-6">
            <div className="text-center">
              <FontAwesomeIcon icon="industry" className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Production Lines</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first production line
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Production Line
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Production Line</DialogTitle>
            <DialogDescription>
              Configure a new production line with its specifications and capacity
            </DialogDescription>
          </DialogHeader>
          <AddProductionLineForm onClose={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      {selectedLine && (
        <Dialog open={!!selectedLine} onOpenChange={(open) => !open && setSelectedLine(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedLine.name}</DialogTitle>
              <DialogDescription>{selectedLine.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <BuildStageProgress line={selectedLine} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}