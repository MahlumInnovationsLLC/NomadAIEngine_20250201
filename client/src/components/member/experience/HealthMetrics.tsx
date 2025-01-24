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
  faCircleCheck
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface HealthMetric {
  id: number;
  type: 'steps' | 'heartRate' | 'sleep' | 'calories';
  value: number;
  unit: string;
  timestamp: string;
  goal?: number;
  trend?: 'up' | 'down' | 'stable';
}

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
  // In the future, this will fetch real data from the API
  const { data: healthMetrics = mockHealthData } = useQuery<HealthMetric[]>({
    queryKey: ['/api/health-metrics'],
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faHeartPulse} className="h-5 w-5 text-red-500" />
            Health Metrics
          </CardTitle>
          <Button variant="outline" size="sm">
            Connect Device
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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

        <div className="mt-4">
          <Button className="w-full" variant="outline">
            View Detailed Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
