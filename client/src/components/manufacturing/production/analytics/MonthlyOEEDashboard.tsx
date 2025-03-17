import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyAnalyticsData } from "../../../../types/manufacturing/analytics";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

interface MonthlyOEEDashboardProps {
  data: MonthlyAnalyticsData;
}

export function MonthlyOEEDashboard({ data }: MonthlyOEEDashboardProps) {
  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFF"];
  
  // Helper function to determine trend icon and class
  const getTrendIndicator = (trend: number) => {
    if (trend > 0) {
      return {
        icon: "arrow-up",
        class: "text-green-500",
      };
    } else if (trend < 0) {
      return {
        icon: "arrow-down",
        class: "text-red-500",
      };
    } else {
      return {
        icon: "minus",
        class: "text-gray-500",
      };
    }
  };
  
  // Format as percent with 1 decimal place
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OEE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatPercent(data.kpis.oee.value)}</span>
              <FontAwesomeIcon
                icon="tachometer-alt"
                className="h-8 w-8 text-primary opacity-80"
              />
            </div>
            <div className="flex items-center mt-1">
              <FontAwesomeIcon
                icon={getTrendIndicator(data.kpis.oee.trend).icon}
                className={`h-3 w-3 mr-1 ${getTrendIndicator(data.kpis.oee.trend).class}`}
              />
              <span className={`text-xs ${getTrendIndicator(data.kpis.oee.trend).class}`}>
                {Math.abs(data.kpis.oee.trend * 100).toFixed(1)}% vs prev month
              </span>
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
                {formatPercent(data.kpis.availability.value)}
              </span>
              <FontAwesomeIcon
                icon="check-circle"
                className="h-8 w-8 text-green-500 opacity-80"
              />
            </div>
            <div className="flex items-center mt-1">
              <FontAwesomeIcon
                icon={getTrendIndicator(data.kpis.availability.trend).icon}
                className={`h-3 w-3 mr-1 ${
                  getTrendIndicator(data.kpis.availability.trend).class
                }`}
              />
              <span
                className={`text-xs ${
                  getTrendIndicator(data.kpis.availability.trend).class
                }`}
              >
                {Math.abs(data.kpis.availability.trend * 100).toFixed(1)}% vs prev month
              </span>
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
                {formatPercent(data.kpis.performance.value)}
              </span>
              <FontAwesomeIcon
                icon="gauge-high"
                className="h-8 w-8 text-blue-500 opacity-80"
              />
            </div>
            <div className="flex items-center mt-1">
              <FontAwesomeIcon
                icon={getTrendIndicator(data.kpis.performance.trend).icon}
                className={`h-3 w-3 mr-1 ${
                  getTrendIndicator(data.kpis.performance.trend).class
                }`}
              />
              <span
                className={`text-xs ${
                  getTrendIndicator(data.kpis.performance.trend).class
                }`}
              >
                {Math.abs(data.kpis.performance.trend * 100).toFixed(1)}% vs prev month
              </span>
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
                {formatPercent(data.kpis.quality.value)}
              </span>
              <FontAwesomeIcon
                icon="star"
                className="h-8 w-8 text-yellow-500 opacity-80"
              />
            </div>
            <div className="flex items-center mt-1">
              <FontAwesomeIcon
                icon={getTrendIndicator(data.kpis.quality.trend).icon}
                className={`h-3 w-3 mr-1 ${
                  getTrendIndicator(data.kpis.quality.trend).class
                }`}
              />
              <span
                className={`text-xs ${
                  getTrendIndicator(data.kpis.quality.trend).class
                }`}
              >
                {Math.abs(data.kpis.quality.trend * 100).toFixed(1)}% vs prev month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.kpis.downtime.value}h</span>
              <FontAwesomeIcon
                icon="hourglass-half"
                className="h-8 w-8 text-red-500 opacity-80"
              />
            </div>
            <div className="flex items-center mt-1">
              <FontAwesomeIcon
                icon={getTrendIndicator(-data.kpis.downtime.trend).icon}
                className={`h-3 w-3 mr-1 ${
                  getTrendIndicator(-data.kpis.downtime.trend).class
                }`}
              />
              <span
                className={`text-xs ${
                  getTrendIndicator(-data.kpis.downtime.trend).class
                }`}
              >
                {Math.abs(data.kpis.downtime.trend * 100).toFixed(1)}% vs prev month
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="chart-pie" className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="production-lines">
            <FontAwesomeIcon icon="industry" className="mr-2 h-4 w-4" />
            Production Lines
          </TabsTrigger>
          <TabsTrigger value="bottlenecks">
            <FontAwesomeIcon icon="funnel-dollar" className="mr-2 h-4 w-4" />
            Bottlenecks
          </TabsTrigger>
          <TabsTrigger value="capacity">
            <FontAwesomeIcon icon="project-diagram" className="mr-2 h-4 w-4" />
            Capacity
          </TabsTrigger>
          <TabsTrigger value="waste">
            <FontAwesomeIcon icon="trash-alt" className="mr-2 h-4 w-4" />
            Waste & Yield
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OEE by Production Line</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.productionLines}
                      margin={{ top: 20, right: 20, bottom: 5, left: 50 }}
                    >
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="line" width={80} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value) => [`${value}%`, 'OEE']} />
                      <Legend />
                      <Bar dataKey="oee" name="OEE" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OEE Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.oeeTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
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
                        dataKey="target"
                        name="Target"
                        stroke="#82ca9d"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Production Lines Tab */}
        <TabsContent value="production-lines">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Line Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.productionLines}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="line" />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar dataKey="availability" name="Availability" fill="#8884d8" />
                      <Bar dataKey="performance" name="Performance" fill="#82ca9d" />
                      <Bar dataKey="quality" name="Quality" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technology Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={90} data={data.technologyRadar}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Technology"
                          dataKey="A"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>First Pass Yield</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        layout="vertical"
                        data={data.firstPassYield}
                        margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
                      >
                        <CartesianGrid stroke="#f5f5f5" />
                        <XAxis type="number" unit="%" domain={[0, 100]} />
                        <YAxis dataKey="line" type="category" scale="band" width={100} />
                        <Tooltip formatter={(value) => [`${value}%`, '']} />
                        <Legend />
                        <Bar
                          dataKey="current"
                          barSize={20}
                          fill="#413ea0"
                          name="FPY Current"
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#ff7300"
                          name="Target"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bottleneck Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.bottlenecks}
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
                        {data.bottlenecks.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Bottlenecks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.bottlenecks
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .map((bottleneck, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                          <span>{bottleneck.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{bottleneck.value} hrs</span>
                          <span className="text-xs text-muted-foreground">
                            {(
                              (bottleneck.value /
                                data.bottlenecks.reduce(
                                  (sum, b) => sum + b.value,
                                  0
                                )) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Recommended Actions</h3>
                  <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                    <li>Schedule maintenance for {data.bottlenecks[0]?.name}</li>
                    <li>Optimize setup procedures for {data.bottlenecks[1]?.name}</li>
                    <li>Review training program for operators</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.capacityUtilization}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actual" name="Actual" stackId="a" fill="#8884d8" />
                    <Bar dataKey="forecast" name="Forecast" stackId="a" fill="#82ca9d" />
                    <Line
                      type="monotone"
                      dataKey="capacity"
                      name="Max Capacity"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waste & Yield Tab */}
        <TabsContent value="waste">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Waste by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.waste}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="current"
                        name="Current Month"
                        fill="#8884d8"
                      />
                      <Bar
                        dataKey="previous"
                        name="Previous Month"
                        fill="#82ca9d"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>First Pass Yield Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.firstPassYield}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis dataKey="line" />
                      <YAxis unit="%" domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar
                        dataKey="current"
                        barSize={20}
                        fill="#8884d8"
                        name="Current FPY"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#ff7300"
                        name="Target"
                      />
                      <Scatter
                        dataKey="delta"
                        fill="red"
                        name="Gap"
                        shape="star"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}