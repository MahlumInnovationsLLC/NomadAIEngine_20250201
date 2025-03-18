import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, BarChart, Settings, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  type: 'assembly' | 'machining' | 'fabrication' | 'packaging' | 'testing';
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  capacity: {
    planned: number;
    actual: number;
    unit: string;
  };
  performance: {
    efficiency: number;
    quality: number;
    availability: number;
    oee: number;
  };
}

export function ProductionLineOverview() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch production lines data
  const { data: productionLines = [], isLoading, error } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    // For development, let's have a 5 second refresh interval
    refetchInterval: 5000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'offline':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    }
  };

  // Calculate summary metrics
  const totalLines = productionLines.length;
  const operationalLines = productionLines.filter(line => line.status === 'operational').length;
  const averageOEE = productionLines.length > 0 
    ? productionLines.reduce((sum, line) => sum + line.performance.oee, 0) / productionLines.length
    : 0;
  const averageQuality = productionLines.length > 0 
    ? productionLines.reduce((sum, line) => sum + line.performance.quality, 0) / productionLines.length
    : 0;

  // If we're loading, show a loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // If there's an error, show an error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Production Lines</h3>
            <p className="text-muted-foreground">
              Unable to load production line data. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Production Line Management</h2>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Production Line
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Active Lines</div>
            <div className="text-2xl font-bold">{operationalLines}/{totalLines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Average OEE</div>
            <div className="text-2xl font-bold">{(averageOEE * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Quality Rate</div>
            <div className="text-2xl font-bold">{(averageQuality * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Production Capacity</div>
            <div className="text-2xl font-bold">
              {productionLines.reduce((sum, line) => sum + line.capacity.actual, 0)} / 
              {productionLines.reduce((sum, line) => sum + line.capacity.planned, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Production Lines</CardTitle>
              <CardDescription>
                Overview of all production lines and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productionLines.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Production Lines Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first production line
                  </p>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Production Line
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {productionLines.map((line) => (
                    <Card key={line.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{line.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {line.description || `${line.type} line`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(line.status)}
                            >
                              {line.status}
                            </Badge>
                            <Button variant="ghost" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>OEE</span>
                              <span className="font-medium">{(line.performance.oee * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={line.performance.oee * 100} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Efficiency</span>
                              <div className="font-medium">{(line.performance.efficiency * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quality</span>
                              <div className="font-medium">{(line.performance.quality * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Availability</span>
                              <div className="font-medium">{(line.performance.availability * 100).toFixed(1)}%</div>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">
                              {line.capacity.actual} / {line.capacity.planned} {line.capacity.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for all production lines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed charts and analytics for production line performance will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Production Schedules</CardTitle>
              <CardDescription>
                View and manage production line schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scheduling Coming Soon</h3>
                <p className="text-muted-foreground">
                  Production scheduling and planning features will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}