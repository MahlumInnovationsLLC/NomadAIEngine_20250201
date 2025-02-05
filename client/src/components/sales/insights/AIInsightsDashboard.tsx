import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import { analyzeDealPotential, getSalesRecommendations } from "@/lib/ai/salesInsights";
import { AISalesChat } from "./AISalesChat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  faBrain, 
  faLightbulb, 
  faKey,
  faTriangleExclamation,
  faCheckCircle,
  faChartLine,
  faRocket,
  faFileUpload,
  faSpinner
} from "@fortawesome/pro-light-svg-icons";

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
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const { data: dealInsights, isLoading: dealInsightsLoading } = useQuery({
    queryKey: ['dealInsights', currentDeal?.id],
    queryFn: () => analyzeDealPotential(currentDeal),
    enabled: !!currentDeal,
    retry: 1
  });

  const { data: salesInsights, isLoading: salesInsightsLoading } = useQuery({
    queryKey: ['salesInsights'],
    queryFn: () => getSalesRecommendations(salesData),
    enabled: !!salesData,
    retry: 1
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setAnalysisResult(result.analysis);
    } catch (error) {
      console.error('Error analyzing file:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check for API key error
  const hasApiKeyError = dealInsights === null || salesInsights === null;

  if (hasApiKeyError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faKey} className="text-destructive" />
            Azure OpenAI Configuration Required
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              To enable AI-powered sales insights, please ensure your Azure OpenAI service is properly configured.
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
          <p className="text-muted-foreground">Powered by Azure OpenAI</p>
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
                <div className="flex items-center justify-center py-8">
                  <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary" />
                </div>
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
                          icon={faTriangleExclamation} 
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
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No deal insights available
                </div>
              )}
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
              <div className="flex items-center justify-center py-8">
                <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-primary" />
              </div>
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFileUpload} className="text-primary" />
              Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="flex-1"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Button 
                onClick={analyzeFile} 
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faBrain} className="h-4 w-4 mr-2" />
                )}
                Analyze
              </Button>
            </div>
            {analysisResult && (
              <Alert>
                <AlertDescription>
                  {analysisResult}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <AISalesChat />
        </div>
      </div>
    </div>
  );
}