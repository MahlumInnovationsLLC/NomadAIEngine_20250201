import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { ProductionLinePanel } from "../components/manufacturing/ProductionLinePanel";
import { QualityControlPanel } from "../components/manufacturing/QualityControlPanel";
import { ProjectManagementPanel } from "../components/manufacturing/ProjectManagementPanel";

export default function ManufacturingControlPage() {
  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-8">Manufacturing Control</h1>
          <p className="text-muted-foreground mb-4">
            Monitor and optimize your vehicle production process with AI-powered insights
          </p>
        </div>

        <Tabs defaultValue="production" className="mt-8">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="production">
              <FontAwesomeIcon icon="industry" className="mr-2" />
              Production Line
            </TabsTrigger>
            <TabsTrigger value="quality">
              <FontAwesomeIcon icon="check-circle" className="mr-2" />
              Quality Control
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