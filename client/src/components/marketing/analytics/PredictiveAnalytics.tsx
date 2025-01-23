import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useState } from "react";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

// Sample predictive data - Replace with actual API data
const predictiveData = [
  { date: "2025-01", actual: 1200, predicted: 1250, confidence: 90 },
  { date: "2025-02", actual: 1350, predicted: 1400, confidence: 85 },
  { date: "2025-03", actual: null, predicted: 1550, confidence: 80 },
  { date: "2025-04", actual: null, predicted: 1700, confidence: 75 },
  { date: "2025-05", actual: null, predicted: 1850, confidence: 70 },
];

const performanceMetrics = [
  { metric: "Click-through Rate", current: "2.8%", predicted: "3.2%", trend: "up" },
  { metric: "Conversion Rate", current: "1.5%", predicted: "1.8%", trend: "up" },
  { metric: "Cost per Acquisition", current: "$45", predicted: "$42", trend: "down" },
  { metric: "Customer Lifetime Value", current: "$850", predicted: "$920", trend: "up" },
];

export function PredictiveAnalytics() {
  const [metric, setMetric] = useState("engagement");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engagement">Engagement Rate</SelectItem>
            <SelectItem value="conversion">Conversion Rate</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="roi">ROI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={predictiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <Alert className="mt-4">
              <AlertDescription>
                Predictions are based on historical data and market trends. Confidence levels decrease for longer-term predictions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {performanceMetrics.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                <FontAwesomeIcon 
                  icon={['fal' as IconPrefix, item.trend === "up" ? "arrow-trend-up" as IconName : "arrow-trend-down" as IconName]} 
                  className={`h-4 w-4 ${item.trend === "up" ? "text-green-500" : "text-red-500"}`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.predicted}</div>
                <p className="text-xs text-muted-foreground">
                  Current: {item.current}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
