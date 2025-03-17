import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BOMManagement } from "./production/BOMManagement";
import { MaterialRequirementsPlanning } from "./production/MaterialRequirementsPlanning";
import { InventoryAllocation } from "./production/InventoryAllocation";
import { ProductionHotProjectsGrid } from "./production/ProductionHotProjectsGrid";
import { ProductionScheduler } from "./production/ProductionScheduler";
import { BayScheduler } from "./production/BayScheduler";
import { ProductionAnalyticsDashboard } from "./production/ProductionAnalyticsDashboard";
import { ProductionPlanningDashboard } from "./production/ProductionPlanningDashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductionLine, ProductionBay, ProductionOrder, ProductionProject } from "@/types/manufacturing";

export const ProductionLinePanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: productionLines = [] } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    refetchInterval: 5000,
  });

  const { data: projects = [] } = useQuery<ProductionProject[]>({
    queryKey: ['/api/manufacturing/projects'],
    refetchInterval: 10000,
  });

  const { data: bays = [] } = useQuery<ProductionBay[]>({
    queryKey: ['/api/manufacturing/bays', selectedLineId],
    enabled: !!selectedLineId,
  });

  const { data: orders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/manufacturing/orders', selectedLineId],
    enabled: !!selectedLineId,
  });
  
  const handleLineChange = (lineId: string) => {
    setSelectedLineId(lineId);
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/bays', lineId] });
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/orders', lineId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Manufacturing Operations</h1>
          <p className="text-muted-foreground">
            Manage production planning, scheduling, and resource allocation
          </p>
        </div>
        <div className="flex space-x-2">
          {activeTab === "projects" && (
            <Button>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
          {activeTab === "scheduling" && (
            <Select value={selectedLineId || ''} onValueChange={handleLineChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Production Line" />
              </SelectTrigger>
              <SelectContent>
                {productionLines.map(line => (
                  <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="industry" className="mr-2" />
            Production Overview
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FontAwesomeIcon icon="project-diagram" className="mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="planning">
            <FontAwesomeIcon icon="tasks" className="mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="scheduling">
            <FontAwesomeIcon icon="calendar" className="mr-2" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="bom">
            <FontAwesomeIcon icon="sitemap" className="mr-2" />
            BOM Management
          </TabsTrigger>
          <TabsTrigger value="mrp">
            <FontAwesomeIcon icon="chart-line" className="mr-2" />
            MRP
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <FontAwesomeIcon icon="boxes-stacked" className="mr-2" />
            Inventory Allocation
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <FontAwesomeIcon icon="chart-pie" className="mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProductionHotProjectsGrid />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Production Projects</CardTitle>
                <CardDescription>Active and upcoming manufacturing projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Tabs defaultValue="active">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="planning">Planning</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="all">All Projects</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="space-y-4 pt-4">
                      {projects.filter(p => p.status === 'in_progress' || p.status === 'active').length > 0 ? (
                        projects
                          .filter(p => p.status === 'in_progress' || p.status === 'active')
                          .map(project => (
                            <Card key={project.id} className="cursor-pointer hover:bg-accent/5">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium">{project.name}</h3>
                                    <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                                  </div>
                                  <Badge variant="outline">{project.status}</Badge>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Start Date</p>
                                    <p>{new Date(project.startDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Target Date</p>
                                    <p>{new Date(project.targetCompletionDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Progress</p>
                                    <Progress value={project.metrics.completionPercentage} className="h-2 mt-1" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center py-8">
                          <FontAwesomeIcon icon="clipboard-check" className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
                          <p className="text-muted-foreground">
                            There are no active projects at the moment
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="planning" className="space-y-4 pt-4">
                      {projects.filter(p => p.status === 'planning').length > 0 ? (
                        projects
                          .filter(p => p.status === 'planning')
                          .map(project => (
                            <Card key={project.id} className="cursor-pointer hover:bg-accent/5">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium">{project.name}</h3>
                                    <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                                  </div>
                                  <Badge variant="outline">{project.status}</Badge>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Start Date</p>
                                    <p>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Target Date</p>
                                    <p>{project.targetCompletionDate ? new Date(project.targetCompletionDate).toLocaleDateString() : 'TBD'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Planning Status</p>
                                    <p>{project.planningStage || 'Initial'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center py-8">
                          <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Projects in Planning</h3>
                          <p className="text-muted-foreground">
                            There are no projects in the planning stage
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Summary</CardTitle>
                  <CardDescription>Project status overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Active Projects</div>
                      <div className="font-medium">{projects.filter(p => p.status === 'in_progress' || p.status === 'active').length}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Planning Stage</div>
                      <div className="font-medium">{projects.filter(p => p.status === 'planning').length}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <div className="font-medium">{projects.filter(p => p.status === 'completed').length}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Delayed</div>
                      <div className="font-medium">{projects.filter(p => (p.status === 'in_progress' || p.status === 'active') && p.isDelayed).length}</div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Project Status Distribution</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 bg-green-500 rounded" style={{ width: `${(projects.filter(p => p.status === 'completed').length / projects.length) * 100}%` }} />
                        <div className="h-2 bg-blue-500 rounded" style={{ width: `${(projects.filter(p => p.status === 'in_progress' || p.status === 'active').length / projects.length) * 100}%` }} />
                        <div className="h-2 bg-yellow-500 rounded" style={{ width: `${(projects.filter(p => p.status === 'planning').length / projects.length) * 100}%` }} />
                        <div className="h-2 bg-red-500 rounded" style={{ width: `${(projects.filter(p => p.status === 'on_hold').length / projects.length) * 100}%` }} />
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-xs mt-1">
                        <div className="text-green-500">Completed</div>
                        <div className="text-blue-500">In Progress</div>
                        <div className="text-yellow-500">Planning</div>
                        <div className="text-red-500">On Hold</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                  <CardDescription>Project resource usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Equipment Utilization</div>
                        <div className="text-sm font-medium">78%</div>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Labor Allocation</div>
                        <div className="text-sm font-medium">92%</div>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Material Availability</div>
                        <div className="text-sm font-medium">85%</div>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm">Production Capacity</div>
                        <div className="text-sm font-medium">65%</div>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <ProductionPlanningDashboard productionLineId={selectedLineId ?? undefined} />
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          {selectedLineId ? (
            <div className="space-y-6">
              <ProductionScheduler productionLineId={selectedLineId} />
              <BayScheduler 
                bays={bays}
                orders={orders}
                onAssign={(orderId, bayId) => {
                  console.log(`Assigned order ${orderId} to bay ${bayId}`);
                }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FontAwesomeIcon icon="calendar" className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Production Line</h3>
                <p className="text-muted-foreground">
                  Please select a production line from the overview to view and manage its schedule
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bom" className="space-y-6">
          <BOMManagement />
        </TabsContent>

        <TabsContent value="mrp" className="space-y-6">
          <MaterialRequirementsPlanning />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-6">
            {productionLines.map((line) => (
              <Card key={line.id}>
                <CardHeader>
                  <CardTitle>{line.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <InventoryAllocation productionLine={line} />
                </CardContent>
              </Card>
            ))}
            {productionLines.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <FontAwesomeIcon icon="boxes-stacked" className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Production Lines</h3>
                  <p className="text-muted-foreground">
                    Add production lines to manage inventory allocation
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <ProductionAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};