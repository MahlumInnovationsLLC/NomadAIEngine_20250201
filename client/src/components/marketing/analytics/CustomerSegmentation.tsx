import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useState } from "react";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

// Sample data - Replace with actual API data
const segmentationData = [
  { name: "High Value", value: 30, color: "hsl(var(--primary))" },
  { name: "Regular", value: 45, color: "hsl(var(--secondary))" },
  { name: "Occasional", value: 15, color: "hsl(var(--accent))" },
  { name: "At Risk", value: 10, color: "hsl(var(--destructive))" },
];

const behaviorMetrics = [
  { category: "Purchase Frequency", high: 85, medium: 45, low: 20 },
  { category: "Average Order Value", high: 92, medium: 58, low: 25 },
  { category: "Engagement Rate", high: 78, medium: 52, low: 30 },
  { category: "Brand Loyalty", high: 88, medium: 62, low: 35 },
];

export function CustomerSegmentation() {
  const [timeframe, setTimeframe] = useState("30d");
  const [view, setView] = useState<"overview" | "detailed">("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Customer Segmentation</h2>
        <div className="flex gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
              <SelectItem value="365d">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setView(view === "overview" ? "detailed" : "overview")}
          >
            <FontAwesomeIcon 
              icon={['fal' as IconPrefix, view === "overview" ? "chart-pie" as IconName : "chart-line" as IconName]} 
              className="mr-2 h-4 w-4" 
            />
            {view === "overview" ? "Show Details" : "Show Overview"}
          </Button>
        </div>
      </div>

      {view === "overview" ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer Segment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Behavioral Metrics by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={behaviorMetrics}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="high" 
                  name="High Value"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="medium" 
                  name="Regular"
                  fill="hsl(var(--secondary))" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="low" 
                  name="Occasional"
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>

            <Alert className="mt-4">
              <AlertDescription>
                Behavioral metrics are calculated based on historical customer data and normalized on a scale of 0-100.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
