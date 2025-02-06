import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ServiceTicket } from "@/types/field-service";

interface AITicketAnalysisProps {
  ticket: ServiceTicket;
  onAssign: (technicianId: string) => void;
  onOverridePriority: (priority: ServiceTicket['priority']) => void;
}

export function AITicketAnalysis({ ticket, onAssign, onOverridePriority }: AITicketAnalysisProps) {
  const aiAnalysis = ticket.aiAnalysis;

  if (!aiAnalysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">AI analysis not available for this ticket</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">AI Ticket Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Priority Analysis</h3>
            <Badge variant={
              aiAnalysis.suggestedPriority === 'critical' ? 'destructive' :
              aiAnalysis.suggestedPriority === 'high' ? 'default' :
              aiAnalysis.suggestedPriority === 'medium' ? 'secondary' :
              'outline'
            }>
              {aiAnalysis.suggestedPriority}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={aiAnalysis.priorityScore * 100} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {(aiAnalysis.priorityScore * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Confidence: {(aiAnalysis.confidenceScore * 100).toFixed(0)}%
          </p>
        </div>

        <Separator />

        {/* Impact Factors */}
        <div className="space-y-2">
          <h3 className="font-medium">Key Factors</h3>
          <div className="space-y-2">
            {aiAnalysis.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{factor.factor}</span>
                <div className="flex items-center gap-2">
                  <Progress value={factor.impact * 100} className="w-24" />
                  <Tooltip>
                    <TooltipTrigger>
                      <FontAwesomeIcon 
                        icon="circle-info" 
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{factor.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Suggested Technicians */}
        <div className="space-y-2">
          <h3 className="font-medium">Recommended Technicians</h3>
          <div className="space-y-2">
            {aiAnalysis.suggestedTechnicians.map((tech, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tech #{tech.technicianId}</span>
                    <Badge variant="outline">
                      {(tech.matchScore * 100).toFixed(0)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tech.reasons[0]}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssign(tech.technicianId)}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Additional Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-1">Category</h3>
            <Badge variant="outline">{aiAnalysis.category}</Badge>
          </div>
          <div>
            <h3 className="font-medium mb-1">Est. Resolution Time</h3>
            <span className="text-sm">
              {aiAnalysis.estimatedResolutionTime} hours
            </span>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <h3 className="font-medium mb-2">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
