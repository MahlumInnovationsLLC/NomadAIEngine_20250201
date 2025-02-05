import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFilter,
  faChartPie,
  faArrowTrendUp,
  faClock,
  faCalendar,
  faUserGroup,
  faDollarSign,
  faPercentage
} from "@fortawesome/free-solid-svg-icons";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

interface PipelineStage {
  id: number;
  name: string;
  deals: number;
  value: number;
}

interface PipelineAnalyticsProps {
  stages: PipelineStage[];
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PipelineAnalytics({ stages, timeframe, onTimeframeChange }: PipelineAnalyticsProps) {
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = stages.reduce((sum, stage) => sum + stage.deals, 0);
  
  const pieData = stages.map(stage => ({
    name: stage.name,
    value: stage.value
  }));

  const getConversionRate = (stageIndex: number) => {
    if (stageIndex === 0) return 100;
    const currentDeals = stages[stageIndex].deals;
    const previousDeals = stages[stageIndex - 1].deals;
    return previousDeals ? Math.round((currentDeals / previousDeals) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pipeline Analytics</h3>
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last quarter</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {totalDeals} deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <FontAwesomeIcon icon={faChartPie} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(totalValue / totalDeals).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Per deal average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <FontAwesomeIcon icon={faPercentage} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32%</div>
            <p className="text-xs text-muted-foreground">Last {timeframe} period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sales Cycle</CardTitle>
            <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 days</div>
            <p className="text-xs text-muted-foreground">From lead to close</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stage.name}</span>
                    <Badge variant="secondary">{getConversionRate(index)}% conversion</Badge>
                  </div>
                  <Progress value={getConversionRate(index)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
