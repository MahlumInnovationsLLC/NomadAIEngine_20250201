import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAnalyticsData } from "../../../../types/manufacturing/analytics";
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
  YAxis 
} from "recharts";

interface DailyPerformanceTrackerProps {
  data: DailyAnalyticsData;
}

export function DailyPerformanceTracker({ data }: DailyPerformanceTrackerProps) {
  // Calculate total downtime in minutes
  const totalDowntime = data.downtimeEvents.reduce(
    (acc, event) => acc + event.duration,
    0
  );
  
  // Group quality issues by type
  const qualityByType = data.qualityIssues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});
  
  const qualityPieData = Object.entries(qualityByType).map(([name, value]) => ({
    name,
    value,
  }));
  
  // Group downtime events by reason
  const downtimeByReason = data.downtimeEvents.reduce((acc: Record<string, number>, event) => {
    acc[event.reason] = (acc[event.reason] || 0) + event.duration;
    return acc;
  }, {});
  
  const downtimePieData = Object.entries(downtimeByReason).map(([name, value]) => ({
    name,
    value,
  }));
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF'];
  const statusColors = {
    resolved: '#10B981',
    ongoing: '#F59E0B',
    open: '#EF4444',
    investigating: '#6366F1',
  };
  
  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-xs text-muted-foreground mt-1">
              Target: 85.0%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cycle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.kpis.cycleTime} s</span>
              <FontAwesomeIcon 
                icon="stopwatch" 
                className="h-8 w-8 text-primary opacity-80" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {data.kpis.taktTime} s takt time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totalDowntime} min</span>
              <FontAwesomeIcon 
                icon="clock" 
                className="h-8 w-8 text-yellow-500 opacity-80" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.downtimeEvents.filter(e => e.status === 'ongoing').length} ongoing issues
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="production">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="production">
            <FontAwesomeIcon icon="industry" className="mr-2 h-4 w-4" />
            Production
          </TabsTrigger>
          <TabsTrigger value="quality">
            <FontAwesomeIcon icon="check-square" className="mr-2 h-4 w-4" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="downtime">
            <FontAwesomeIcon icon="exclamation-triangle" className="mr-2 h-4 w-4" />
            Downtime
          </TabsTrigger>
          <TabsTrigger value="standup">
            <FontAwesomeIcon icon="user-friends" className="mr-2 h-4 w-4" />
            Standup
          </TabsTrigger>
        </TabsList>
        
        {/* Production Tab */}
        <TabsContent value="production">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Hourly Production</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hourlyProduction}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="actual" 
                        name="Actual Units" 
                        fill="#3B82F6" 
                      />
                      <Bar 
                        dataKey="target" 
                        name="Target Units" 
                        fill="#D1D5DB" 
                      />
                      <Line 
                        type="monotone"
                        dataKey="efficiency"
                        name="Efficiency (%)"
                        stroke="#10B981"
                        yAxisId={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance KPIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Availability</span>
                      <span className="text-sm">{(data.kpis.availability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${data.kpis.availability * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Performance</span>
                      <span className="text-sm">{(data.kpis.performance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${data.kpis.performance * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Quality</span>
                      <span className="text-sm">{(data.kpis.quality * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${data.kpis.quality * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">OEE</span>
                      <span className="text-sm">{(data.kpis.oee * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${data.kpis.oee * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Quality Tab */}
        <TabsContent value="quality">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Issues by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {qualityPieData.map((entry, index) => (
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
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Quality Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.qualityIssues
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 5)
                    .map((issue) => (
                      <div 
                        key={issue.id} 
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">{issue.type}</p>
                          <p className="text-sm text-muted-foreground">
                            Line: {issue.line} | {new Date(issue.time).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              issue.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : issue.severity === 'major'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              issue.status === 'open'
                                ? 'bg-red-100 text-red-800'
                                : issue.status === 'investigating'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Downtime Tab */}
        <TabsContent value="downtime">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Downtime by Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={downtimePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {downtimePieData.map((entry, index) => (
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
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Downtime Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.downtimeEvents
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((event) => (
                      <div 
                        key={event.id} 
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">{event.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            Line: {event.line} | {new Date(event.time).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm mr-2">
                            {event.duration} min
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              event.status === 'ongoing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Standup Tab */}
        <TabsContent value="standup">
          <Card>
            <CardHeader>
              <CardTitle>Morning Standup Notes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Meeting led by {data.standupNotes.leader}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Discussion Points</h3>
                  <p className="text-sm">{data.standupNotes.discussionPoints}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Action Items</h3>
                  <ul className="space-y-2">
                    {data.standupNotes.actionItems.map((item, index) => (
                      <li key={index} className="flex justify-between text-sm border-b pb-1">
                        <span>{item.item}</span>
                        <span className="font-medium">{item.owner}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}