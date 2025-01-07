import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
    if (score >= 80) return { level: "Low", color: "text-green-500", icon: Shield };
    if (score >= 60) return { level: "Moderate", color: "text-yellow-500", icon: Activity };
    return { level: "High", color: "text-red-500", icon: AlertTriangle };
  }, [score]);

  const Icon = riskLevel.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Predictive Maintenance Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${riskLevel.color}`} />
            <span className={`font-semibold ${riskLevel.color}`}>
              {riskLevel.level} Risk
            </span>
          </div>
          <span className="text-2xl font-bold">{Math.round(score)}%</span>
        </div>

        <Progress 
          value={score} 
          className="h-2 mb-4" 
          indicatorClassName={score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}
        />

        {riskFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Risk Factors</h4>
            {riskFactors.map((factor, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{factor.factor}</span>
                  <span className={factor.impact >= 0.7 ? "text-red-500" : 
                                 factor.impact >= 0.4 ? "text-yellow-500" : 
                                 "text-green-500"}>
                    {Math.round(factor.impact * 100)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
            ))}
          </div>
        )}

        {lastUpdate && (
          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdate).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
