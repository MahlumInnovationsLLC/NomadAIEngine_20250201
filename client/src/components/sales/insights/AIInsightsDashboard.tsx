import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBrain, 
  faLightbulb, 
  faChartLine,
  faExclamationTriangle,
  faCheckCircle,
  faRocket,
  faKey
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
  const { data: dealInsights, isLoading: dealInsightsLoading, error: dealError } = useQuery({
    queryKey: ['dealInsights', currentDeal?.id],
    queryFn: () => analyzeDealPotential(currentDeal),
    enabled: !!currentDeal,
    retry: 1
  });

  const { data: salesInsights, isLoading: salesInsightsLoading, error: salesError } = useQuery({
    queryKey: ['salesInsights'],
    queryFn: () => getSalesRecommendations(salesData),
    enabled: !!salesData,
    retry: 1
  });

  // Check for API key error
  const hasApiKeyError = (dealError as Error)?.message?.includes('OPENAI_API_KEY') || 
                        (salesError as Error)?.message?.includes('OPENAI_API_KEY');

  if (hasApiKeyError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faKey} className="text-destructive" />
            OpenAI API Key Required
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              To enable AI-powered sales insights, please provide your OpenAI API key. 
              You can get this from your OpenAI account:
            </p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Go to <a href="https://platform.openai.com/api-keys" className="text-primary underline" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a></li>
              <li>Create a new secret key</li>
              <li>Add the key to your environment variables</li>
            </ol>
            <p className="mt-4">
              Contact your system administrator to configure the API key.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              ) : dealError && !hasApiKeyError ? (
                <Alert>
                  <AlertTitle>Error Loading Insights</AlertTitle>
                  <AlertDescription>
                    Unable to load deal insights. Please try again later.
                  </AlertDescription>
                </Alert>
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
            ) : salesError && !hasApiKeyError ? (
              <Alert>
                <AlertTitle>Error Loading Recommendations</AlertTitle>
                <AlertDescription>
                  Unable to load sales recommendations. Please try again later.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}