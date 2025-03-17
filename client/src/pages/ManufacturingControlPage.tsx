import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { ProductionLinePanel } from "../components/manufacturing/ProductionLinePanel";
import { QualityControlPanel } from "../components/manufacturing/QualityControlPanel";
import { ProjectManagementPanel } from "../components/manufacturing/ProjectManagementPanel";
import { ProductionAnalyticsDashboard } from "../components/manufacturing/production/ProductionAnalyticsDashboard";
import { useQuery } from "@tanstack/react-query";
import FabricationDashboard from "../components/facility/manufacturing/FabricationDashboard";
import CncManagement from "../components/facility/manufacturing/CncManagement";
import WeldingManagement from "../components/facility/manufacturing/WeldingManagement";
import LaserCuttingManagement from "../components/facility/manufacturing/LaserCuttingManagement";
import BendingManagement from "../components/facility/manufacturing/BendingManagement";
import MaterialOptimizationPanel from "../components/facility/manufacturing/MaterialOptimizationPanel";
import MaterialManagement from "../components/facility/manufacturing/MaterialManagement";

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
              <FontAwesomeIcon icon={['fal', 'circle-check']} className="mr-2 h-4 w-4 text-green-500" />
              Quality Assurance
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FontAwesomeIcon icon="tasks" className="mr-2" />
              Project Management
            </TabsTrigger>
            <TabsTrigger value="fabrication">
              <FontAwesomeIcon icon="industry" className="mr-2" />
              Fabrication
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

          <TabsContent value="fabrication" className="space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="cnc">CNC</TabsTrigger>
                <TabsTrigger value="welding">Welding</TabsTrigger>
                <TabsTrigger value="laser">Laser Cutting</TabsTrigger>
                <TabsTrigger value="bending">Bending</TabsTrigger>
                <TabsTrigger value="optimization">Material Optimization</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <FabricationDashboard />
              </TabsContent>

              <TabsContent value="cnc" className="mt-4">
                <CncManagement />
              </TabsContent>

              <TabsContent value="welding" className="mt-4">
                <WeldingManagement />
              </TabsContent>

              <TabsContent value="laser" className="mt-4">
                <LaserCuttingManagement />
              </TabsContent>

              <TabsContent value="bending" className="mt-4">
                <BendingManagement />
              </TabsContent>

              <TabsContent value="optimization" className="mt-4">
                <MaterialOptimizationPanel />
              </TabsContent>
              <TabsContent value="materials" className="mt-4">
                <MaterialManagement />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ProductionAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AnimateTransition>
  );
}