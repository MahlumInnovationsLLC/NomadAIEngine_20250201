import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import ProductionLinesGrid from "./production/ProductionLinesGrid";
import { ProductionScheduler } from "./production/ProductionScheduler";
import { BayScheduler } from "./production/BayScheduler";
import { BOMManagement } from "./production/BOMManagement";
import { MaterialRequirementsPlanning } from "./production/MaterialRequirementsPlanning";
import { InventoryAllocation } from "./production/InventoryAllocation";
import { useQuery } from "@tanstack/react-query";
import type { ProductionLine, ProductionBay, ProductionOrder } from "@/types/manufacturing";

export const ProductionLinePanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { data: productionLines = [] } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    refetchInterval: 5000,
  });

  const { data: bays = [] } = useQuery<ProductionBay[]>({
    queryKey: ['/api/manufacturing/bays', selectedLineId],
    enabled: !!selectedLineId,
  });

  const { data: orders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/manufacturing/orders', selectedLineId],
    enabled: !!selectedLineId,
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="industry" className="mr-2" />
            Production Overview
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
          <ProductionLinesGrid onLineSelect={setSelectedLineId} />
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
          {selectedLineId ? (
            <BOMManagement productId={selectedLineId} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FontAwesomeIcon icon="sitemap" className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Production Line</h3>
                <p className="text-muted-foreground">
                  Please select a production line to manage its Bill of Materials
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mrp" className="space-y-6">
          {selectedLineId ? (
            <MaterialRequirementsPlanning productionLineId={selectedLineId} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FontAwesomeIcon icon="chart-line" className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Production Line</h3>
                <p className="text-muted-foreground">
                  Please select a production line to view material requirements planning
                </p>
              </CardContent>
            </Card>
          )}
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
          <Card>
            <CardHeader>
              <CardTitle>Production Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Production analytics features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};