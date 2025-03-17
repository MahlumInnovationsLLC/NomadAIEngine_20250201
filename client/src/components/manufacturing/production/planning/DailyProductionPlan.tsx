import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@/components/ui/font-awesome-icon';
import { DailyAnalytics } from '@/lib/api/manufacturing-analytics';

interface DailyProductionPlanProps {
  date: Date;
  analyticsData?: DailyAnalytics;
  isLoading?: boolean;
  onDateChange?: (date: Date) => void;
  productionLineId?: string;
}

export function DailyProductionPlan({ date, analyticsData, isLoading, onDateChange }: DailyProductionPlanProps) {
  const [activeTab, setActiveTab] = useState('schedule');
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDay = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.9) return 'text-green-500';
    if (efficiency >= 0.75) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Build production schedule from analytics data or use placeholder structure
  const buildProductionSchedule = () => {
    if (!analyticsData) {
      return {
        shifts: [],
        productionTargets: [],
        resources: [],
      };
    }

    const hourlyData = analyticsData.hourlyProduction || [];
    
    // Group into shifts (morning, afternoon, evening)
    const morningHours = hourlyData.filter(h => {
      const hour = parseInt(h.hour.split(':')[0]);
      return hour >= 6 && hour < 14;
    });
    
    const afternoonHours = hourlyData.filter(h => {
      const hour = parseInt(h.hour.split(':')[0]);
      return hour >= 14 && hour < 22;
    });
    
    const nightHours = hourlyData.filter(h => {
      const hour = parseInt(h.hour.split(':')[0]);
      return hour >= 22 || hour < 6;
    });

    const shifts = [
      {
        name: 'Morning Shift',
        startTime: '6:00 AM',
        endTime: '2:00 PM',
        efficiency: morningHours.length > 0 
          ? morningHours.reduce((sum, h) => sum + h.efficiency, 0) / morningHours.length 
          : 0,
        production: morningHours.reduce((sum, h) => sum + h.actual, 0),
        target: morningHours.reduce((sum, h) => sum + h.target, 0)
      },
      {
        name: 'Afternoon Shift',
        startTime: '2:00 PM',
        endTime: '10:00 PM',
        efficiency: afternoonHours.length > 0 
          ? afternoonHours.reduce((sum, h) => sum + h.efficiency, 0) / afternoonHours.length 
          : 0,
        production: afternoonHours.reduce((sum, h) => sum + h.actual, 0),
        target: afternoonHours.reduce((sum, h) => sum + h.target, 0)
      },
      {
        name: 'Night Shift',
        startTime: '10:00 PM',
        endTime: '6:00 AM',
        efficiency: nightHours.length > 0 
          ? nightHours.reduce((sum, h) => sum + h.efficiency, 0) / nightHours.length 
          : 0,
        production: nightHours.reduce((sum, h) => sum + h.actual, 0),
        target: nightHours.reduce((sum, h) => sum + h.target, 0)
      }
    ];

    // Get bottlenecks if available
    const resources = analyticsData.topBottlenecks?.map(bottleneck => ({
      name: bottleneck.station,
      utilization: bottleneck.impact,
      status: bottleneck.impact > 0.9 ? 'overloaded' : bottleneck.impact > 0.7 ? 'busy' : 'normal'
    })) || [];

    return {
      shifts,
      productionTargets: [
        {
          productLine: 'Main Assembly',
          target: hourlyData.reduce((sum, h) => sum + h.target, 0),
          actual: hourlyData.reduce((sum, h) => sum + h.actual, 0),
          efficiency: hourlyData.length > 0 
            ? hourlyData.reduce((sum, h) => sum + h.efficiency, 0) / hourlyData.length
            : 0
        }
      ],
      resources
    };
  };

  const productionPlan = buildProductionSchedule();

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Daily Production Plan</CardTitle>
            <CardDescription>{formatDate(date)}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDay(-1)}>
              <FontAwesomeIcon icon="chevron-left" className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDay(1)}>
              Next
              <FontAwesomeIcon icon="chevron-right" className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="targets">Production Targets</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="pt-4">
            <ScrollArea className="h-[320px] pr-4">
              {productionPlan.shifts.map((shift, index) => (
                <div key={index} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{shift.name}</h3>
                      <p className="text-sm text-muted-foreground">{shift.startTime} - {shift.endTime}</p>
                    </div>
                    <Badge 
                      variant={shift.efficiency >= 0.85 ? "success" : shift.efficiency >= 0.7 ? "warning" : "destructive"}
                    >
                      {Math.round(shift.efficiency * 100)}% Efficiency
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Production Progress</span>
                      <span className="text-sm font-medium">{shift.production} / {shift.target} units</span>
                    </div>
                    <Progress value={(shift.production / (shift.target || 1)) * 100} className="h-2" />
                  </div>
                  
                  {index < productionPlan.shifts.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="targets" className="pt-4">
            <ScrollArea className="h-[320px] pr-4">
              {productionPlan.productionTargets.map((target, index) => (
                <div key={index} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{target.productLine}</h3>
                    <Badge 
                      variant={target.efficiency >= 0.85 ? "success" : target.efficiency >= 0.7 ? "warning" : "destructive"}
                    >
                      {Math.round(target.efficiency * 100)}% Efficiency
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Daily Target</span>
                        <span className="text-sm font-medium">{target.actual} / {target.target} units</span>
                      </div>
                      <Progress value={(target.actual / (target.target || 1)) * 100} className="h-2 mt-1" />
                    </div>
                    
                    {analyticsData?.hourlyProduction && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-3">
                        <h4 className="text-sm font-medium mb-2">Hourly Production</h4>
                        <div className="space-y-3">
                          {analyticsData.hourlyProduction.map((hour, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span>{hour.hour}</span>
                              <div className="flex-1 mx-4">
                                <Progress value={(hour.actual / (hour.target || 1)) * 100} className="h-1.5" />
                              </div>
                              <span className={getEfficiencyColor(hour.efficiency)}>
                                {hour.actual}/{hour.target}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="resources" className="pt-4">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4">
                {productionPlan.resources.map((resource, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{resource.name}</h3>
                      <Badge 
                        variant={
                          resource.status === 'normal' ? 'success' : 
                          resource.status === 'busy' ? 'warning' : 'destructive'
                        }
                      >
                        {resource.status === 'normal' ? 'Normal' : 
                         resource.status === 'busy' ? 'High Load' : 'Bottleneck'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Utilization</span>
                        <span className="text-sm font-medium">{Math.round(resource.utilization * 100)}%</span>
                      </div>
                      <Progress 
                        value={resource.utilization * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
                
                {analyticsData?.downtimeEvents && analyticsData.downtimeEvents.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Downtime Events</h3>
                    <div className="space-y-3">
                      {analyticsData.downtimeEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                          <div>
                            <div className="font-medium text-sm">{event.reason}</div>
                            <div className="text-xs text-muted-foreground">{event.time}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge variant={event.status === 'resolved' ? 'outline' : 'destructive'} className="text-xs">
                              {event.status}
                            </Badge>
                            <span className="text-xs mt-1">{event.duration} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center">
          <FontAwesomeIcon icon="info-circle" className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Last updated at {new Date().toLocaleTimeString()}</span>
        </div>
        <Button variant="outline" size="sm">
          <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
          Print Plan
        </Button>
      </CardFooter>
    </Card>
  );
}

export default DailyProductionPlan;