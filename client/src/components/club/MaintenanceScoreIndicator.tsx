import { useMemo } from "react";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

interface MaintenanceScoreIndicatorProps {
  score: number;
  riskFactors?: RiskFactor[];
  lastUpdate?: Date;
}

export default function MaintenanceScoreIndicator({
  score,
  riskFactors = [],
  lastUpdate,
}: MaintenanceScoreIndicatorProps) {
  const riskLevel = useMemo(() => {
    if (score >= 80) return { level: "Low", color: "text-green-500", icon: "shield" };
    if (score >= 60) return { level: "Moderate", color: "text-yellow-500", icon: "cloud" };
    return { level: "High", color: "text-red-500", icon: "triangle-exclamation" };
  }, [score]);

  const formattedRiskFactors = riskFactors.map(factor => ({
    ...factor,
    impactColor: factor.impact >= 0.7 ? "text-red-500" : 
                factor.impact >= 0.4 ? "text-yellow-500" : 
                "text-green-500"
  }));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm">
            <FontAwesomeIcon icon={riskLevel.icon} className={`h-4 w-4 ${riskLevel.color}`} />
            <div className="flex flex-col">
              <span className="text-xs font-medium">Maintenance Score</span>
              <div className="flex items-center gap-1">
                <Progress 
                  value={score} 
                  className={`w-16 h-1.5 ${
                    score >= 80 ? "bg-green-500" : 
                    score >= 60 ? "bg-yellow-500" : 
                    "bg-red-500"
                  }`}
                />
                <span className={`text-xs ${riskLevel.color}`}>
                  {Math.round(score)}%
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="w-80">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Risk Level: {riskLevel.level}</span>
              <span className="font-medium">{Math.round(score)}%</span>
            </div>

            {formattedRiskFactors.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-sm font-medium">Risk Factors:</h4>
                {formattedRiskFactors.map((factor, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{factor.factor}</span>
                      <span className={factor.impactColor}>
                        {Math.round(factor.impact * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>
            )}

            {lastUpdate && (
              <div className="text-xs text-muted-foreground pt-1">
                Last updated: {lastUpdate.toLocaleString()}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}