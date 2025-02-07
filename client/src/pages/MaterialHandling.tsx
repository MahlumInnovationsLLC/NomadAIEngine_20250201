import MaterialDashboard from "@/components/material/MaterialDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";

interface MaterialStats {
  totalInventoryValue: number;
  lowStockItems: number;
  activeOrders: number;
  supplyChainHealth: number;
}

export default function MaterialHandling() {
  const { data: stats } = useQuery<MaterialStats>({
    queryKey: ['/api/material/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="container mx-auto">
      <div className="py-6 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="px-4">
          <h1 className="text-3xl font-bold mb-2">Material Handling & Supply Chain</h1>
          <p className="text-muted-foreground">
            Comprehensive inventory management and supply chain optimization system
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                  <h3 className="text-2xl font-bold">${stats?.totalInventoryValue?.toLocaleString() || 0}</h3>
                </div>
                <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                  <h3 className="text-2xl font-bold">{stats?.lowStockItems || 0}</h3>
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
                  <h3 className="text-2xl font-bold">{stats?.activeOrders || 0}</h3>
                </div>
                <FontAwesomeIcon icon="truck-fast" className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supply Chain Health</p>
                  <h3 className="text-2xl font-bold">{stats?.supplyChainHealth || 0}%</h3>
                </div>
                <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        <MaterialDashboard hideStats />
      </div>
    </div>
  );
}