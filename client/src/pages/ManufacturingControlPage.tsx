import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { ProductionLinePanel } from "../components/manufacturing/ProductionLinePanel";
import { QualityControlPanel } from "../components/manufacturing/QualityControlPanel";
import { ProjectManagementPanel } from "../components/manufacturing/ProjectManagementPanel";
import { useQuery } from "@tanstack/react-query";

interface ManufacturingStats {
  activeLines: number;
  qualityScore: number;
  efficiency: number;
  activeProjects: number;
}

export default function ManufacturingControlPage() {
  const { data: stats } = useQuery<ManufacturingStats>({
    queryKey: ['/api/manufacturing/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Manufacturing</h1>
          <p className="text-muted-foreground mb-4">
            Monitor and optimize your vehicle production process with AI-powered insights
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Lines</p>
                    <h3 className="text-2xl font-bold">{stats?.activeLines || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="industry" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                    <h3 className="text-2xl font-bold">{stats?.qualityScore || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="check-circle" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Rate</p>
                    <h3 className="text-2xl font-bold">{stats?.efficiency || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="gauge-high" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <h3 className="text-2xl font-bold">{stats?.activeProjects || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="tasks" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="production" className="mt-8">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="production">
              <FontAwesomeIcon icon="industry" className="mr-2" />
              Production Line
            </TabsTrigger>
            <TabsTrigger value="quality">
              <FontAwesomeIcon icon="check-circle" className="mr-2" />
              Quality Assurance
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FontAwesomeIcon icon="tasks" className="mr-2" />
              Project Management
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <FontAwesomeIcon icon="wrench" className="mr-2" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <FontAwesomeIcon icon="chart-line" className="mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="space-y-6">
            <ProductionLinePanel />
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <QualityControlPanel />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectManagementPanel />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            {/* Predictive Maintenance Panel will go here */}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Manufacturing Analytics Panel will go here */}
          </TabsContent>
        </Tabs>
      </div>
    </AnimateTransition>
  );
}