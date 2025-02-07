import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimateTransition } from "@/components/ui/AnimateTransition";
import { InventoryManagement } from "./inventory/InventoryManagement";
import { SupplyChainView } from "./supply-chain/SupplyChainView";
import { MaterialTracking } from "./tracking/MaterialTracking";
import { WarehouseManagement } from "./warehouse/WarehouseManagement";
import { ProcurementDashboard } from "./procurement/ProcurementDashboard";
import { ForecastingAnalytics } from "./forecasting/ForecastingAnalytics";
//import { useQuery } from "@tanstack/react-query"; //Removed as data is no longer used
import type { InventoryStats, SupplyChainMetrics } from "@/types/material";

interface MaterialDashboardProps {
  hideStats?: boolean;
}

export default function MaterialDashboard({ hideStats = false }: MaterialDashboardProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <Tabs defaultValue="inventory" className="mt-8">
          <TabsList className="grid w-full grid-cols-6 mb-8">
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
            <TabsTrigger value="warehouse">
              <FontAwesomeIcon icon="warehouse" className="mr-2" />
              Warehouse
            </TabsTrigger>
            <TabsTrigger value="procurement">
              <FontAwesomeIcon icon="shopping-cart" className="mr-2" />
              Procurement
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <FontAwesomeIcon icon="chart-mixed" className="mr-2" />
              Forecasting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryManagement 
              selectedWarehouse={selectedWarehouse}
              onWarehouseChange={setSelectedWarehouse}
            />
          </TabsContent>

          <TabsContent value="supply-chain" className="space-y-6">
            <SupplyChainView />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <MaterialTracking selectedWarehouse={selectedWarehouse} />
          </TabsContent>

          <TabsContent value="warehouse" className="space-y-6">
            <WarehouseManagement 
              onWarehouseSelect={setSelectedWarehouse}
              selectedWarehouse={selectedWarehouse}
            />
          </TabsContent>

          <TabsContent value="procurement" className="space-y-6">
            <ProcurementDashboard />
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <ForecastingAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </AnimateTransition>
  );
}