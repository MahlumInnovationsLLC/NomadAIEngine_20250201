import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, startOfWeek, endOfWeek, addDays, getWeek, getYear } from "date-fns";

interface WeeklyProductionPlanProps {
  productionLineId?: string;
  weekString?: string;
  analyticsData?: any;
  onWeekChange?: (weekString: string) => void;
  isLoading?: boolean;
}

function WeeklyProductionPlan({ 
  productionLineId,
  weekString,
  analyticsData,
  onWeekChange,
  isLoading: externalIsLoading
}: WeeklyProductionPlanProps) {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Calculate current week dates
  const today = new Date();
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + (selectedWeekOffset * 7));
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const formattedWeek = `${getYear(currentDate)}-${getWeek(currentDate, { weekStartsOn: 1 }).toString().padStart(2, '0')}`;
  const weekDisplay = `Week ${getWeek(currentDate, { weekStartsOn: 1 })} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')})`;
  
  // Fetch weekly production data
  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ['/api/manufacturing/weekly-production', formattedWeek, productionLineId],
    queryFn: async () => {
      const url = `/api/manufacturing/weekly-production?week=${formattedWeek}${productionLineId ? `&lineId=${productionLineId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weekly production data');
      return response.json();
    },
    refetchInterval: 5 * 60000, // Refresh every 5 minutes
  });
  
  // Fetch maintenance schedule
  const { data: maintenanceSchedule } = useQuery({
    queryKey: ['/api/manufacturing/maintenance-schedule', formattedWeek],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing/maintenance-schedule?week=${formattedWeek}`);
      if (!response.ok) throw new Error('Failed to fetch maintenance schedule');
      return response.json();
    }
  });

  const navigateWeek = (offset: number) => {
    setSelectedWeekOffset(prev => prev + offset);
    
    // If external week change handler is provided, call it with the new week
    if (onWeekChange) {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (offset * 7));
      const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
      const newFormattedWeek = `${getYear(newDate)}-${getWeek(newDate, { weekStartsOn: 1 }).toString().padStart(2, '0')}`;
      onWeekChange(newFormattedWeek);
    }
  };
  
  // Use external data if provided
  const displayData = analyticsData || weeklyData;
  
  // Use external loading state if provided, otherwise use internal loading state
  if (externalIsLoading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Production Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <FontAwesomeIcon icon="spinner" className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">{weekDisplay}</h3>
          <p className="text-muted-foreground">
            {selectedWeekOffset === 0 ? "Current Week" : selectedWeekOffset < 0 ? "Past Week" : "Future Week"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <FontAwesomeIcon icon="arrow-left" className="mr-2 h-4 w-4" />
            Previous Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedWeekOffset(0)}
            disabled={selectedWeekOffset === 0}
          >
            Current Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            Next Week
            <FontAwesomeIcon icon="arrow-right" className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Output</p>
                <h3 className="text-2xl font-bold">{displayData?.summary.totalOutput || 0}</h3>
              </div>
              <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              {displayData?.summary.outputVsLastWeek > 0 ? (
                <>
                  <FontAwesomeIcon icon="arrow-up" className="mr-1 text-green-500" />
                  <span className="text-green-500">{Math.abs(displayData.summary.outputVsLastWeek)}%</span>
                </>
              ) : displayData?.summary.outputVsLastWeek < 0 ? (
                <>
                  <FontAwesomeIcon icon="arrow-down" className="mr-1 text-red-500" />
                  <span className="text-red-500">{Math.abs(displayData.summary.outputVsLastWeek)}%</span>
                </>
              ) : (
                <span>No change</span>
              )}
              <span className="ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">OEE</p>
                <h3 className="text-2xl font-bold">{(displayData?.summary.weeklyOEE || 0).toFixed(1)}%</h3>
              </div>
              <FontAwesomeIcon icon="gauge-high" className="h-8 w-8 text-green-500" />
            </div>
            <Progress 
              value={displayData?.summary.weeklyOEE || 0} 
              className="mt-2"
              indicatorColor={
                (displayData?.summary.weeklyOEE || 0) >= 85 ? 'bg-green-500' : 
                (displayData?.summary.weeklyOEE || 0) >= 70 ? 'bg-yellow-500' : 
                'bg-red-500'
              }
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">First Pass Yield</p>
                <h3 className="text-2xl font-bold">{(displayData?.summary.firstPassYield || 0).toFixed(1)}%</h3>
              </div>
              <FontAwesomeIcon icon="check-circle" className="h-8 w-8 text-purple-500" />
            </div>
            <Progress 
              value={displayData?.summary.firstPassYield || 0} 
              className="mt-2"
              indicatorColor={
                (displayData?.summary.firstPassYield || 0) >= 95 ? 'bg-green-500' : 
                (displayData?.summary.firstPassYield || 0) >= 85 ? 'bg-yellow-500' : 
                'bg-red-500'
              }
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Downtime</p>
                <h3 className="text-2xl font-bold">{displayData?.summary.totalDowntime || 0} hrs</h3>
              </div>
              <FontAwesomeIcon icon="exclamation-triangle" className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {displayData?.summary.plannedDowntime || 0} hrs planned / {displayData?.summary.unplannedDowntime || 0} hrs unplanned
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Schedule Adherence</p>
                <h3 className="text-2xl font-bold">{(displayData?.summary.scheduleAdherence || 0).toFixed(1)}%</h3>
              </div>
              <FontAwesomeIcon icon="calendar-check" className="h-8 w-8 text-teal-500" />
            </div>
            <Progress 
              value={displayData?.summary.scheduleAdherence || 0} 
              className="mt-2"
              indicatorColor={
                (displayData?.summary.scheduleAdherence || 0) >= 90 ? 'bg-green-500' : 
                (displayData?.summary.scheduleAdherence || 0) >= 75 ? 'bg-yellow-500' : 
                'bg-red-500'
              }
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Production Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Weekly Production Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <FontAwesomeIcon icon="chart-line" className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <FontAwesomeIcon icon="wrench" className="mr-2 h-4 w-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="quality">
                <FontAwesomeIcon icon="clipboard-check" className="mr-2 h-4 w-4" />
                Quality
              </TabsTrigger>
              <TabsTrigger value="efficiency">
                <FontAwesomeIcon icon="tachometer-alt" className="mr-2 h-4 w-4" />
                Efficiency
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Production Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {displayData?.dailyOutput ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayData.dailyOutput}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar 
                                dataKey="planned" 
                                name="Planned" 
                                fill="#9CA3AF" 
                              />
                              <Bar 
                                dataKey="actual" 
                                name="Actual" 
                                fill="#3B82F6" 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Completion Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {displayData?.projectStatus?.map((project: any) => (
                          <div key={project.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{project.name}</span>
                              <Badge
                                variant="outline"
                                className={
                                  project.status === 'on_track' ? 'bg-green-500/10 text-green-500' :
                                  project.status === 'at_risk' ? 'bg-yellow-500/10 text-yellow-500' :
                                  project.status === 'delayed' ? 'bg-red-500/10 text-red-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }
                              >
                                {project.status === 'on_track' ? 'On Track' :
                                 project.status === 'at_risk' ? 'At Risk' :
                                 project.status === 'delayed' ? 'Delayed' :
                                 'Completed'}
                              </Badge>
                            </div>
                            <Progress value={project.completion} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress: {project.completion}%</span>
                              <span>Due: {format(new Date(project.dueDate), 'MMM d')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Maintenance Tab */}
            <TabsContent value="maintenance">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preventive Maintenance Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {maintenanceSchedule?.preventiveMaintenance?.length > 0 ? (
                        maintenanceSchedule.preventiveMaintenance.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">{item.equipmentName}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(item.scheduledDate), 'EEEE, MMM d')} - {item.estimatedDuration} hrs
                              </p>
                            </div>
                            <Badge 
                              variant="outline"
                              className={
                                item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                                item.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500' :
                                item.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                'bg-red-500/10 text-red-500'
                              }
                            >
                              {item.status === 'scheduled' ? 'Scheduled' :
                               item.status === 'in_progress' ? 'In Progress' :
                               item.status === 'completed' ? 'Completed' :
                               'Cancelled'}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No preventive maintenance scheduled this week</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {maintenanceSchedule?.maintenancePerformance ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Completed', value: maintenanceSchedule.maintenancePerformance.completed },
                                { name: 'In Progress', value: maintenanceSchedule.maintenancePerformance.inProgress },
                                { name: 'Overdue', value: maintenanceSchedule.maintenancePerformance.overdue },
                                { name: 'Scheduled', value: maintenanceSchedule.maintenancePerformance.scheduled }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              <Cell fill="#10B981" />
                              <Cell fill="#F59E0B" />
                              <Cell fill="#EF4444" />
                              <Cell fill="#3B82F6" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Quality Tab */}
            <TabsContent value="quality">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Quality Metrics Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {displayData?.qualityTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={displayData.qualityTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="firstPassYield" 
                              name="First Pass Yield (%)" 
                              stroke="#10B981" 
                              activeDot={{ r: 8 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="defectRate" 
                              name="Defect Rate (%)" 
                              stroke="#EF4444" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Defect Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayData?.topDefects?.length > 0 ? (
                        displayData.topDefects.map((defect: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{defect.type}</span>
                              <span className="text-sm">{defect.count} occurrences</span>
                            </div>
                            <Progress 
                              value={defect.percentage} 
                              className="h-2" 
                              indicatorColor="bg-red-500" 
                            />
                            <p className="text-xs text-muted-foreground">{defect.percentage}% of total defects</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No defect data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Efficiency Tab */}
            <TabsContent value="efficiency">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>OEE Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {displayData?.oeeComponents ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={displayData.oeeComponents}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="availability" 
                              name="Availability" 
                              fill="#3B82F6" 
                            />
                            <Bar 
                              dataKey="performance" 
                              name="Performance" 
                              fill="#10B981" 
                            />
                            <Bar 
                              dataKey="quality" 
                              name="Quality" 
                              fill="#8B5CF6" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Equipment Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayData?.equipmentEfficiency?.length > 0 ? (
                        displayData.equipmentEfficiency.map((equipment: any) => (
                          <div key={equipment.id} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{equipment.name}</span>
                              <span className="text-sm">{equipment.oee.toFixed(1)}% OEE</span>
                            </div>
                            <Progress value={equipment.oee} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>A: {equipment.availability.toFixed(1)}%</span>
                              <span>P: {equipment.performance.toFixed(1)}%</span>
                              <span>Q: {equipment.quality.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No equipment efficiency data available</p>
                        </div>
                      )}
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

export default WeeklyProductionPlan;