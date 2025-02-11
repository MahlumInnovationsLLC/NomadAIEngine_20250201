import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Scatter
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  faChartLine,
  faBoxes,
  faArrowTrendUp,
  faCalendarAlt,
  faChartPie,
  faWaveSquare,
  faPercentage,
  faFilter,
  faTable,
  faDownload
} from "@fortawesome/pro-light-svg-icons";
import type { MaterialForecast, ForecastAccuracy, Material } from "@/types/material";

export function ForecastingDashboard() {
  const [timeframe, setTimeframe] = useState("month");
  const [forecastHorizon, setForecastHorizon] = useState("3months");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const { data: forecasts } = useQuery<MaterialForecast[]>({
    queryKey: ['/api/material/forecasts', timeframe, forecastHorizon, selectedMaterial],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: accuracy } = useQuery<ForecastAccuracy>({
    queryKey: ['/api/material/forecasts/accuracy', selectedMaterial],
  });

  const { data: materials } = useQuery<Material[]>({
    queryKey: ['/api/material/items'],
  });

  const getAccuracyColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceInterval = (forecast: MaterialForecast) => {
    const standardError = Math.sqrt(forecast.metadata?.modelAccuracy || 0);
    return {
      upper: forecast.predicted + (1.96 * standardError),
      lower: forecast.predicted - (1.96 * standardError)
    };
  };

  const handleExportData = () => {
    if (!forecasts) return;

    const csv = [
      ['Period', 'Actual', 'Predicted', 'Seasonal Index', 'Confidence', 'Variance'],
      ...forecasts.map(f => [
        f.period,
        f.actual,
        f.predicted,
        f.seasonalIndex.toFixed(2),
        f.confidence,
        ((f.predicted - f.actual) / f.actual * 100).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Demand Forecasting</h2>
          <p className="text-muted-foreground">
            AI-powered demand predictions and inventory optimization
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedMaterial || ''} onValueChange={setSelectedMaterial}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials?.map(material => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name} ({material.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Forecast horizon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExportData}>
            <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forecast Accuracy</p>
                <p className={`text-2xl font-bold ${getAccuracyColor(accuracy?.overall || 0)}`}>
                  {accuracy?.overall || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MAPE: {accuracy?.metrics.mape.toFixed(2)}%
                </p>
              </div>
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted Growth</p>
                <p className="text-2xl font-bold text-green-500">+{accuracy?.predictedGrowth || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {accuracy?.metrics.mae.toFixed(2)}%
                </p>
              </div>
              <FontAwesomeIcon icon={faArrowTrendUp} className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Forecasted</p>
                <p className="text-2xl font-bold">{accuracy?.itemsCovered || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  RMSE: {accuracy?.metrics.rmse.toFixed(2)}
                </p>
              </div>
              <FontAwesomeIcon icon={faBoxes} className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Demand Forecast Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={forecasts}>
                <defs>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const interval = getConfidenceInterval(data);
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.period}</p>
                        <p>Actual: {data.actual}</p>
                        <p>Predicted: {data.predicted}</p>
                        <p className="text-xs text-muted-foreground">
                          Confidence Interval: [{interval.lower.toFixed(2)} - {interval.upper.toFixed(2)}]
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#8884d8"
                  fill="url(#colorConfidence)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Scatter
                  dataKey="confidence"
                  fill="#8884d8"
                  shape="circle"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal Patterns & Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={forecasts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="seasonalIndex"
                  fill="#8884d8"
                  opacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="trendline"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Seasonal Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecasts?.map((forecast) => (
                <div key={`${forecast.materialId}-${forecast.period}-factors`} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Seasonal Factor</span>
                    <span className="text-sm font-medium">{forecast.factors.seasonal}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trend Factor</span>
                    <span className="text-sm font-medium">{forecast.factors.trend}x</span>
                  </div>
                  {forecast.factors.special_events && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {forecast.factors.special_events.map((event) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Forecast Breakdown</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Actual Demand</TableHead>
                <TableHead>Predicted Demand</TableHead>
                <TableHead>Seasonal Index</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecasts?.map((forecast) => {
                const variance = ((forecast.predicted - forecast.actual) / forecast.actual * 100).toFixed(2);
                return (
                  <TableRow key={forecast.period}>
                    <TableCell>{forecast.period}</TableCell>
                    <TableCell>{forecast.actual}</TableCell>
                    <TableCell>{forecast.predicted}</TableCell>
                    <TableCell>{forecast.seasonalIndex.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{forecast.confidence}%</span>
                        <div className="w-24">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${forecast.confidence}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          Number(variance) > 10
                            ? "bg-red-500"
                            : Number(variance) > 5
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }
                      >
                        {variance}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accuracy?.insights?.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <FontAwesomeIcon
                  icon={
                    insight.type === 'trend' ? faChartLine :
                    insight.type === 'seasonal' ? faCalendarAlt :
                    insight.type === 'pattern' ? faWaveSquare :
                    faChartPie
                  }
                  className="h-5 w-5 text-primary mt-0.5"
                />
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.impact && (
                    <Badge
                      className={
                        insight.impact === 'high' ? 'bg-red-500' :
                        insight.impact === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }
                    >
                      {insight.impact.toUpperCase()} IMPACT
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suggested Reorder Points</p>
                    <p className="text-2xl font-bold">15</p>
                  </div>
                  <FontAwesomeIcon icon="cart-plus" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Safety Stock Updates</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <FontAwesomeIcon icon="shield-check" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Alerts</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                  <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}