import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CustomerFeedbackItem, ServiceStats } from "@/types/field-service";

export function QualityMetricsDashboard() {
  const { data: feedbackItems = [] } = useQuery<CustomerFeedbackItem[]>({
    queryKey: ['/api/field-service/feedback'],
  });

  const { data: stats } = useQuery<ServiceStats>({
    queryKey: ['/api/field-service/stats'],
  });

  // Calculate ISO 9001 compliance metrics
  const qualityMetrics = {
    // Response time metrics
    responseTimeCompliance: feedbackItems.reduce((acc, item) => {
      const withinTarget = (item.iso9001?.qualityMetrics.responseTime || 0) <= 24; // 24-hour target
      return acc + (withinTarget ? 1 : 0);
    }, 0) / feedbackItems.length * 100,

    // Resolution metrics
    resolutionTimeCompliance: feedbackItems.reduce((acc, item) => {
      const withinTarget = (item.iso9001?.qualityMetrics.resolutionTime || 0) <= 72; // 72-hour target
      return acc + (withinTarget ? 1 : 0);
    }, 0) / feedbackItems.length * 100,

    // Process effectiveness
    correctiveActionsCompleted: feedbackItems.reduce((acc, item) => {
      const completedActions = (item.iso9001?.correctiveActions || [])
        .filter(action => action.status === 'completed').length;
      const totalActions = (item.iso9001?.correctiveActions || []).length;
      return totalActions ? acc + (completedActions / totalActions) : acc;
    }, 0) / feedbackItems.filter(item => item.iso9001?.correctiveActions?.length).length * 100,

    // Customer satisfaction trend
    satisfactionTrend: Array.from({ length: 6 }, (_, i) => {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - (5 - i));
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthFeedback = feedbackItems.filter(item => {
        const date = new Date(item.createdAt);
        return date >= monthStart && date < monthEnd;
      });

      return {
        month: monthStart.toLocaleString('default', { month: 'short' }),
        rating: monthFeedback.reduce((acc, item) => acc + item.rating, 0) / monthFeedback.length || 0,
      };
    }),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Response Time Compliance</p>
                <p className="text-2xl font-bold">
                  {qualityMetrics.responseTimeCompliance.toFixed(1)}%
                </p>
              </div>
              <Badge variant={qualityMetrics.responseTimeCompliance >= 90 ? 'default' : 'destructive'}>
                Target: 90%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Resolution Time Compliance</p>
                <p className="text-2xl font-bold">
                  {qualityMetrics.resolutionTimeCompliance.toFixed(1)}%
                </p>
              </div>
              <Badge variant={qualityMetrics.resolutionTimeCompliance >= 85 ? 'default' : 'destructive'}>
                Target: 85%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Corrective Actions Completed</p>
                <p className="text-2xl font-bold">
                  {qualityMetrics.correctiveActionsCompleted.toFixed(1)}%
                </p>
              </div>
              <Badge variant={qualityMetrics.correctiveActionsCompleted >= 80 ? 'default' : 'destructive'}>
                Target: 80%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Customer Satisfaction Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityMetrics.satisfactionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
