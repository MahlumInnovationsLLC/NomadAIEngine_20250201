import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyAnalyticsData } from "../../../../types/manufacturing/analytics";
import { Badge } from "@/components/ui/badge";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyTrendAnalysisProps {
  data: WeeklyAnalyticsData;
}

export function WeeklyTrendAnalysis({ data }: WeeklyTrendAnalysisProps) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFF"];

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OEE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{(data.kpis.oee * 100).toFixed(1)}%</span>
              <FontAwesomeIcon
                icon="tachometer-alt"
                className="h-8 w-8 text-primary opacity-80"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {(data.kpis.availability * 100).toFixed(1)}%
              </span>
              <FontAwesomeIcon
                icon="check-circle"
                className="h-8 w-8 text-green-500 opacity-80"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {(data.kpis.performance * 100).toFixed(1)}%
              </span>
              <FontAwesomeIcon
                icon="gauge-high"
                className="h-8 w-8 text-blue-500 opacity-80"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {(data.kpis.quality * 100).toFixed(1)}%
              </span>
              <FontAwesomeIcon
                icon="star"
                className="h-8 w-8 text-yellow-500 opacity-80"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.kpis.downtime} h</span>
              <FontAwesomeIcon
                icon="hourglass-half"
                className="h-8 w-8 text-red-500 opacity-80"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {(data.kpis.maintenanceCompliance * 100).toFixed(1)}%
              </span>
              <FontAwesomeIcon
                icon="clipboard-check"
                className="h-8 w-8 text-purple-500 opacity-80"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="performance">
            <FontAwesomeIcon icon="chart-line" className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <FontAwesomeIcon icon="boxes-stacked" className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="downtime">
            <FontAwesomeIcon icon="exclamation-triangle" className="mr-2 h-4 w-4" />
            Downtime
          </TabsTrigger>
          <TabsTrigger value="kaizen">
            <FontAwesomeIcon icon="lightbulb" className="mr-2 h-4 w-4" />
            Improvements
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly OEE Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, '']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="oee"
                        name="OEE"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="availability"
                        name="Availability"
                        stroke="#82ca9d"
                      />
                      <Line
                        type="monotone"
                        dataKey="performance"
                        name="Performance"
                        stroke="#ffc658"
                      />
                      <Line
                        type="monotone"
                        dataKey="quality"
                        name="Quality"
                        stroke="#ff8042"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Target"
                        stroke="#ccc"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Production Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.production}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="actual"
                        name="Actual Units"
                        fill="#3B82F6"
                      />
                      <Bar
                        dataKey="planned"
                        name="Planned Units"
                        fill="#D1D5DB"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="inStock"
                      name="In Stock"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="allocated"
                      name="Allocated"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                    <Area
                      type="monotone"
                      dataKey="backOrdered"
                      name="Back Ordered"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Downtime Tab */}
        <TabsContent value="downtime">
          <Card>
            <CardHeader>
              <CardTitle>Downtime Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.downtimeReasons}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {data.downtimeReasons.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} min`, 'Duration']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Top Downtime Reasons</h3>
                  <ul className="space-y-3">
                    {data.downtimeReasons
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((reason, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            <span>{reason.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{reason.value} min</span>
                            <span className="text-xs text-muted-foreground">
                              {(
                                (reason.value /
                                  data.downtimeReasons.reduce(
                                    (sum, r) => sum + r.value,
                                    0
                                  )) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </li>
                      ))}
                  </ul>

                  <h3 className="font-medium mt-6">Improvement Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on the above data, focus on reducing the top two reasons
                    for downtime to improve OEE.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kaizen Tab */}
        <TabsContent value="kaizen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kaizen Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.improvements.kaizens.map((kaizen) => (
                    <div
                      key={kaizen.id}
                      className="flex justify-between items-center border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{kaizen.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Owner: {kaizen.owner} | Impact: {kaizen.impact}
                        </p>
                      </div>
                      <Badge
                        variant={
                          kaizen.status === "completed"
                            ? "success"
                            : kaizen.status === "in_progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {kaizen.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gemba Walk Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.improvements.gembaFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="flex justify-between items-center border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{finding.finding}</p>
                        <p className="text-sm text-muted-foreground">
                          Area: {finding.area} | Owner: {finding.owner}
                        </p>
                      </div>
                      <Badge
                        variant={
                          finding.status === "completed"
                            ? "success"
                            : finding.status === "in_progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {finding.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}