import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@/components/ui/font-awesome-icon';

export interface MonthlyProductionPlanProps {
  productionLineId?: string;
}

export function MonthlyProductionPlan({ productionLineId }: MonthlyProductionPlanProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('production');
  
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const navigateMonth = (months: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + months);
    setCurrentMonth(newDate);
  };

  // This is a simplified component that will be enhanced later with actual data
  // For now, it provides basic UI structure to match other planning components
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Monthly Production Plan</CardTitle>
            <CardDescription>{getMonthName(currentMonth)}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
              <FontAwesomeIcon icon="chevron-left" className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
              Next
              <FontAwesomeIcon icon="chevron-right" className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="production" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="production" className="pt-4">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">Monthly Production Overview</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Target Production</div>
                        <div className="text-sm font-medium">2400 units</div>
                      </div>
                      <Progress value={68} className="h-2" />
                      <div className="text-xs text-right mt-1 text-muted-foreground">1632 / 2400 units (68%)</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Quality Rate</div>
                        <div className="text-sm font-medium">94%</div>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Weekly Production</div>
                        <div className="text-xs text-muted-foreground">Current Month</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="text-sm font-medium">Week 1</div>
                          <div className="text-xs">562 units</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Week 2</div>
                          <div className="text-xs">578 units</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Week 3</div>
                          <div className="text-xs">492 units</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Week 4</div>
                          <div className="text-xs">--</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Active Projects</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">Project A-1290</div>
                          <div className="text-xs text-muted-foreground">Standard Production</div>
                        </div>
                        <Badge variant="outline">In Progress</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Completion:</span>
                          <span>68%</span>
                        </div>
                        <Progress value={68} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">Project B-2584</div>
                          <div className="text-xs text-muted-foreground">Custom Order</div>
                        </div>
                        <Badge variant="outline">Planning</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Completion:</span>
                          <span>12%</span>
                        </div>
                        <Progress value={12} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="resources" className="pt-4">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-3">Resource Allocation</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Labor Hours</div>
                        <div className="text-sm font-medium">4,800 / 5,280 hours</div>
                      </div>
                      <Progress value={91} className="h-2" />
                      <div className="text-xs text-right mt-1 text-muted-foreground">91% allocated</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Equipment Time</div>
                        <div className="text-sm font-medium">3,120 / 3,520 hours</div>
                      </div>
                      <Progress value={89} className="h-2" />
                      <div className="text-xs text-right mt-1 text-muted-foreground">89% allocated</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Material Requirements</div>
                        <div className="text-sm font-medium">92% fulfilled</div>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Resource Bottlenecks</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <div className="font-medium">CNC Machining</div>
                        <div className="text-xs text-muted-foreground">Week 3</div>
                      </div>
                      <Badge variant="destructive">Over Capacity</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <div className="font-medium">Testing Lab</div>
                        <div className="text-xs text-muted-foreground">Week 3-4</div>
                      </div>
                      <Badge variant="warning">Near Capacity</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="metrics" className="pt-4">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Efficiency</div>
                    <div className="text-3xl font-bold">87%</div>
                    <div className="text-xs text-green-500">↑ 3% from last month</div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">On-Time Delivery</div>
                    <div className="text-3xl font-bold">93%</div>
                    <div className="text-xs text-green-500">↑ 2% from last month</div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Quality Rate</div>
                    <div className="text-3xl font-bold">94%</div>
                    <div className="text-xs text-green-500">↑ 1% from last month</div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Downtime</div>
                    <div className="text-3xl font-bold">5%</div>
                    <div className="text-xs text-red-500">↑ 1% from last month</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Production Trends</h3>
                  <div className="h-40 flex items-end justify-between gap-1">
                    <div className="relative h-full flex-1 flex flex-col justify-end">
                      <div className="bg-primary/20 rounded-t w-full" style={{ height: '65%' }}></div>
                      <div className="text-xs mt-1 text-center">Jan</div>
                    </div>
                    <div className="relative h-full flex-1 flex flex-col justify-end">
                      <div className="bg-primary/20 rounded-t w-full" style={{ height: '72%' }}></div>
                      <div className="text-xs mt-1 text-center">Feb</div>
                    </div>
                    <div className="relative h-full flex-1 flex flex-col justify-end">
                      <div className="bg-primary/20 rounded-t w-full" style={{ height: '68%' }}></div>
                      <div className="text-xs mt-1 text-center">Mar</div>
                    </div>
                    <div className="relative h-full flex-1 flex flex-col justify-end">
                      <div className="bg-primary w-full rounded-t" style={{ height: '75%' }}></div>
                      <div className="text-xs mt-1 text-center font-medium">Apr</div>
                    </div>
                    <div className="relative h-full flex-1 flex flex-col justify-end">
                      <div className="bg-primary/80 w-full rounded-t" style={{ height: '68%' }}></div>
                      <div className="text-xs mt-1 text-center">Forecast</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center">
          <FontAwesomeIcon icon="info-circle" className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Data updated on {new Date().toLocaleDateString()}</span>
        </div>
        <Button variant="outline" size="sm">
          <FontAwesomeIcon icon="print" className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </CardFooter>
    </Card>
  );
}

export default MonthlyProductionPlan;