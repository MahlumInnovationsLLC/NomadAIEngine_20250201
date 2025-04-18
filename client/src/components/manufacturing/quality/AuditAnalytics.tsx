import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AuditFindingTrend {
  month: string;
  observations: number;
  minorNonConformities: number;
  majorNonConformities: number;
  opportunities: number;
}

interface AuditInsight {
  id: string;
  category: 'trend' | 'risk' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  recommendation?: string;
  relatedFindings: string[];
  timestamp: string;
}

export default function AuditAnalytics() {
  const [timeframe, setTimeframe] = useState<'6months' | '1year'>('6months');

  const { data: auditTrends, isLoading: trendsLoading, error: trendsError } = useQuery<AuditFindingTrend[]>({
    queryKey: ['/api/manufacturing/quality/audits/trends', timeframe],
  });

  const { data: aiInsights, isLoading: insightsLoading, error: insightsError } = useQuery<AuditInsight[]>({
    queryKey: ['/api/manufacturing/quality/audits/insights', timeframe],
  });

  if (trendsError || insightsError) {
    console.error('Audit analytics error:', trendsError || insightsError);
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Error loading audit analytics. Please try again later.
        <p className="text-sm mt-2">
          {trendsError instanceof Error ? trendsError.message : ''}
          {insightsError instanceof Error ? insightsError.message : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Audit Analysis & Insights</h3>
        <div className="space-x-2">
          <Button 
            variant={timeframe === '6months' ? 'default' : 'outline'}
            onClick={() => setTimeframe('6months')}
          >
            6 Months
          </Button>
          <Button
            variant={timeframe === '1year' ? 'default' : 'outline'}
            onClick={() => setTimeframe('1year')}
          >
            1 Year
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finding Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                Loading trends...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={auditTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="observations" 
                    stroke="#8884d8" 
                    name="Observations"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minorNonConformities" 
                    stroke="#82ca9d" 
                    name="Minor NCs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="majorNonConformities" 
                    stroke="#ff7300" 
                    name="Major NCs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="opportunities" 
                    stroke="#0088fe" 
                    name="Opportunities"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                Generating insights...
              </div>
            ) : (
              <div className="space-y-4">
                {aiInsights?.map((insight) => (
                  <Card key={insight.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          insight.category === 'risk' ? 'bg-red-100 text-red-800' :
                          insight.category === 'trend' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      {insight.recommendation && (
                        <div className="text-sm bg-muted p-2 rounded-md">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}