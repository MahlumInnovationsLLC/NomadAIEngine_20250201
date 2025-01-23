import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

// Sample data - Replace with actual API data
const performanceData = [
  { date: "2025-01-01", engagement: 1200, conversions: 80, roi: 320 },
  { date: "2025-01-02", engagement: 1400, conversions: 90, roi: 360 },
  { date: "2025-01-03", engagement: 1100, conversions: 70, roi: 280 },
  { date: "2025-01-04", engagement: 1600, conversions: 100, roi: 400 },
  { date: "2025-01-05", engagement: 1800, conversions: 120, roi: 480 },
];

const segmentData = [
  { segment: "High Value", count: 450, revenue: 45000, engagement: 85 },
  { segment: "Regular", count: 1200, revenue: 72000, engagement: 65 },
  { segment: "Occasional", count: 800, revenue: 24000, engagement: 45 },
  { segment: "New", count: 300, revenue: 9000, engagement: 30 },
];

const channelData = [
  { channel: "Email", reach: 5000, engagement: 25, conversion: 5 },
  { channel: "Facebook", reach: 8000, engagement: 15, conversion: 3 },
  { channel: "Instagram", reach: 6000, engagement: 20, conversion: 4 },
  { channel: "LinkedIn", reach: 3000, engagement: 10, conversion: 2 },
];

export function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState("7d");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <FontAwesomeIcon 
              icon={['fal' as IconPrefix, 'users' as IconName]} 
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22,000</div>
            <p className="text-xs text-muted-foreground">+15% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <FontAwesomeIcon 
              icon={['fal' as IconPrefix, 'chart-line' as IconName]} 
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <FontAwesomeIcon 
              icon={['fal' as IconPrefix, 'bullseye' as IconName]} 
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.8%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <FontAwesomeIcon 
              icon={['fal' as IconPrefix, 'coins' as IconName]} 
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">285%</div>
            <p className="text-xs text-muted-foreground">+32% from last period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="channels">Channel Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Trends</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <XAxis dataKey="date" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    name="Engagement"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    name="Conversions"
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    name="ROI %"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={segmentData}>
                  <XAxis dataKey="segment" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Customer Count"
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="engagement" 
                    name="Engagement %"
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>

              <Alert className="mt-4">
                <AlertDescription>
                  Segments are calculated based on customer behavior, engagement levels, and purchase history.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={channelData}>
                  <XAxis dataKey="channel" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="reach" 
                    name="Reach"
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="engagement" 
                    name="Engagement %"
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="conversion" 
                    name="Conversion %"
                    fill="hsl(var(--accent))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}