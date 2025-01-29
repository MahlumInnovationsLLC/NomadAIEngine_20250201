import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

export default function MaterialDashboard() {
  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-8">Material Handling & Supply Chain</h1>
          <p className="text-muted-foreground mb-4">
            Manage inventory, track materials, and optimize your supply chain with AI-driven insights
          </p>
        </div>

        <Tabs defaultValue="inventory" className="mt-8">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="inventory">
              <FontAwesomeIcon icon="boxes-stacked" className="mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="supply-chain">
              <FontAwesomeIcon icon="truck-fast" className="mr-2" />
              Supply Chain
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <FontAwesomeIcon icon="map-location-dot" className="mr-2" />
              Material Tracking
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <FontAwesomeIcon icon="chart-mixed" className="mr-2" />
              Forecasting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            {/* Inventory Management Panel will go here */}
          </TabsContent>

          <TabsContent value="supply-chain" className="space-y-6">
            {/* Supply Chain Management Panel will go here */}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            {/* Material Tracking Panel will go here */}
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            {/* Forecasting Panel will go here */}
          </TabsContent>
        </Tabs>
      </div>
    </AnimateTransition>
  );
}
