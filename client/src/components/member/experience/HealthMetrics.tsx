import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeartPulse,
  faPersonWalking,
  faBed,
  faFireFlameCurved,
  faArrowTrendUp,
  faCircleCheck,
  faChartLine,
  faBrain,
  faFileLines,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface HealthMetric {
  id: number;
  type: 'steps' | 'heartRate' | 'sleep' | 'calories';
  value: number;
  unit: string;
  timestamp: string;
  goal?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface HealthMetricHistory {
  timestamp: string;
  steps: number;
  heartRate: number;
  sleep: number;
  calories: number;
}

const mockHistoricalData: HealthMetricHistory[] = Array.from({ length: 7 }).map((_, i) => ({
  timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
  steps: 8000 + Math.random() * 4000,
  heartRate: 65 + Math.random() * 15,
  sleep: 6 + Math.random() * 3,
  calories: 2000 + Math.random() * 1000,
}));

const mockHealthData: HealthMetric[] = [
  {
    id: 1,
    type: 'steps',
    value: 8432,
    unit: 'steps',
    timestamp: new Date().toISOString(),
    goal: 10000,
    trend: 'up'
  },
  {
    id: 2,
    type: 'heartRate',
    value: 72,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    trend: 'stable'
  },
  {
    id: 3,
    type: 'sleep',
    value: 7.5,
    unit: 'hours',
    timestamp: new Date().toISOString(),
    goal: 8,
    trend: 'up'
  },
  {
    id: 4,
    type: 'calories',
    value: 2250,
    unit: 'kcal',
    timestamp: new Date().toISOString(),
    goal: 2500,
    trend: 'stable'
  }
];

export function HealthMetrics() {
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric['type']>('steps');
  const { toast } = useToast();

  const { data: healthMetrics = mockHealthData } = useQuery<HealthMetric[]>({
    queryKey: ['/api/health-metrics'],
  });

  const { data: historicalData = mockHistoricalData } = useQuery<HealthMetricHistory[]>({
    queryKey: ['/api/health-metrics/history'],
  });

  const generateReport = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/health-report', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated Successfully",
        description: "Your health report is ready for download.",
        duration: 5000,
      });
      window.open(data.downloadUrl, '_blank');
    },
    onError: (error) => {
      toast({
        title: "Failed to Generate Report",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const getMetricIcon = (type: HealthMetric['type']) => {
    switch (type) {
      case 'steps':
        return faPersonWalking;
      case 'heartRate':
        return faHeartPulse;
      case 'sleep':
        return faBed;
      case 'calories':
        return faFireFlameCurved;
      default:
        return faCircleCheck;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getMetricColor = (type: HealthMetric['type']) => {
    switch (type) {
      case 'steps':
        return "#3b82f6"; // blue
      case 'heartRate':
        return "#ef4444"; // red
      case 'sleep':
        return "#8b5cf6"; // purple
      case 'calories':
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHeartPulse} className="h-5 w-5 text-red-500" />
              Health Metrics Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Syncing
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => generateReport.mutate()}
                disabled={generateReport.isPending}
                className="gap-2"
              >
                {generateReport.isPending ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
                )}
                Generate Report
              </Button>
              <Button variant="outline" size="sm">
                Connect Device
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {healthMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={getMetricIcon(metric.type)}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <span className="font-medium capitalize">
                          {metric.type.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      {metric.trend && (
                        <FontAwesomeIcon
                          icon={faArrowTrendUp}
                          className={`h-4 w-4 ${getTrendColor(metric.trend)}`}
                          style={{
                            transform: metric.trend === 'down' ? 'rotate(180deg)' : 'none'
                          }}
                        />
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>

                    {metric.goal && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round((metric.value / metric.goal) * 100)}%</span>
                        </div>
                        <Progress value={(metric.value / metric.goal) * 100} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="flex gap-2 mb-4">
                {healthMetrics.map((metric) => (
                  <Button
                    key={metric.type}
                    variant={selectedMetric === metric.type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMetric(metric.type)}
                    className="gap-2"
                  >
                    <FontAwesomeIcon icon={getMetricIcon(metric.type)} className="h-4 w-4" />
                    {metric.type.replace(/([A-Z])/g, ' $1').trim()}
                  </Button>
                ))}
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={historicalData}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 10,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="currentColor"
                          className="text-xs"
                        />
                        <YAxis stroke="currentColor" className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey={selectedMetric}
                          stroke={getMetricColor(selectedMetric)}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 mt-1 text-blue-500" />
                        <p className="text-sm">
                          Your {selectedMetric} has improved by 15% compared to last week
                        </p>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon icon={faBrain} className="h-4 w-4 mt-1 text-purple-500" />
                        <p className="text-sm">
                          You're consistently meeting your daily goals
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 mt-1 text-green-500" />
                        <p className="text-sm">
                          Try to maintain consistent activity levels throughout the week
                        </p>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 mt-1 text-green-500" />
                        <p className="text-sm">
                          Consider increasing your daily goal to challenge yourself
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}