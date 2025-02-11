import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaterialDashboard from "@/components/material/MaterialDashboard";
import { ForecastingDashboard } from "@/components/material/forecasting/ForecastingDashboard";
import type { MaterialStats } from "@/types/material";

export default function MaterialHandling() {
  const { data: materialStats } = useQuery<MaterialStats>({
    queryKey: ['/api/material/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="container mx-auto">
      <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-4">Material Handling & Supply Chain</h1>
        <p className="text-muted-foreground mb-4">
          Comprehensive inventory management and supply chain optimization system
        </p>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inventory</p>
                  <h3 className="text-2xl font-bold">{materialStats?.totalItems || 0}</h3>
                </div>
                <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <h3 className="text-2xl font-bold">{materialStats?.activeOrders || 0}</h3>
                </div>
                <FontAwesomeIcon icon="truck-fast" className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                  <h3 className="text-2xl font-bold">{materialStats?.lowStockItems || 0}</h3>
                </div>
                <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warehouse Capacity</p>
                  <h3 className="text-2xl font-bold">{materialStats?.warehouseCapacity || 0}%</h3>
                </div>
                <FontAwesomeIcon icon="warehouse" className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:max-w-[400px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MaterialDashboard />
          </TabsContent>

          <TabsContent value="forecasting">
            <ForecastingDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold">Analytics Dashboard Coming Soon</h3>
              <p className="text-muted-foreground">Advanced analytics features are under development</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}