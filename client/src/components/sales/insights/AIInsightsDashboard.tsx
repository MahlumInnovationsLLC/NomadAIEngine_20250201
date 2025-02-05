import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBrain, 
  faLightbulb, 
  faChartLine,
  faExclamationTriangle,
  faCheckCircle,
  faRocket
} from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { analyzeDealPotential, getSalesRecommendations, type DealInsight, type SalesRecommendations } from "@/lib/ai/salesInsights";

interface Deal {
  id: number;
  company: string;
  value: number;
  stage: string;
  probability: number;
  owner: string;
  manufacturingProject: string;
  lastContact: string;
  score: number;
  qualificationStatus: string;
  nextSteps: string;
  engagement: string;
}

interface PipelineStage {
  id: number;
  name: string;
  deals: number;
  value: number;
}

interface SalesData {
  deals: Deal[];
  pipeline: PipelineStage[];
  performance: Array<{
    month: string;
    revenue: number;
    deals: number;
    conversion: number;
  }>;
}

interface AIInsightsDashboardProps {
  currentDeal?: Deal;
  salesData?: SalesData;
}

export function AIInsightsDashboard({ currentDeal, salesData }: AIInsightsDashboardProps) {
  const { data: dealInsights, isLoading: dealInsightsLoading } = useQuery({
    queryKey: ['dealInsights', currentDeal?.id],
    queryFn: () => analyzeDealPotential(currentDeal),
    enabled: !!currentDeal
  });

  const { data: salesInsights, isLoading: salesInsightsLoading } = useQuery({
    queryKey: ['salesInsights'],
    queryFn: () => getSalesRecommendations(salesData),
    enabled: !!salesData
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Sales Insights</h2>
          <p className="text-muted-foreground">Powered by advanced AI analysis</p>
        </div>
        <FontAwesomeIcon icon={faBrain} className="h-8 w-8 text-primary" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {currentDeal && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} className="text-yellow-500" />
                Deal Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dealInsightsLoading ? (
                <div>Loading insights...</div>
              ) : dealInsights ? (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Deal Score</span>
                      <span>{dealInsights.score}/100</span>
                    </div>
                    <Progress value={dealInsights.score} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    <ul className="space-y-2">
                      {dealInsights.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <FontAwesomeIcon 
                            icon={faCheckCircle} 
                            className="text-green-500 mt-1" 
                          />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {dealInsights.riskFactors.length > 0 && (
                    <Alert>
                      <AlertTitle className="flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={faExclamationTriangle} 
                          className="text-yellow-500" 
                        />
                        Risk Factors
                      </AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {dealInsights.riskFactors.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faRocket} className="text-primary" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesInsightsLoading ? (
              <div>Loading recommendations...</div>
            ) : salesInsights ? (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium">Priority Actions</h4>
                  <ul className="space-y-2">
                    {salesInsights.priorityActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FontAwesomeIcon 
                          icon={faCheckCircle} 
                          className="text-green-500 mt-1" 
                        />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Opportunities</h4>
                  <ul className="space-y-2">
                    {salesInsights.opportunities.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FontAwesomeIcon 
                          icon={faChartLine} 
                          className="text-blue-500 mt-1" 
                        />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}