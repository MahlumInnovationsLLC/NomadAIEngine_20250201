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
import { useQuery } from "@tanstack/react-query";
import type { InventoryStats, SupplyChainMetrics } from "@/types/material";

interface MaterialDashboardProps {
  hideStats?: boolean;
}

export default function MaterialDashboard({ hideStats = false }: MaterialDashboardProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const { data: inventoryStats } = useQuery<InventoryStats>({
    queryKey: ['/api/material/inventory/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: supplyMetrics } = useQuery<SupplyChainMetrics>({
    queryKey: ['/api/material/supply-chain/metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        {!hideStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                    <h3 className="text-2xl font-bold">${inventoryStats?.totalValue?.toLocaleString()}</h3>
                  </div>
                  <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                    <h3 className="text-2xl font-bold">{inventoryStats?.lowStockCount}</h3>
                  </div>
                  <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                    <h3 className="text-2xl font-bold">{supplyMetrics?.activeOrders}</h3>
                  </div>
                  <FontAwesomeIcon icon="truck-fast" className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Supply Chain Health</p>
                    <h3 className="text-2xl font-bold">{supplyMetrics?.healthScore}%</h3>
                  </div>
                  <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
            <SupplyChainView metrics={supplyMetrics} />
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