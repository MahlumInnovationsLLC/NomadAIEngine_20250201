import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import MaterialDashboard from "@/components/material/MaterialDashboard";
import type { MaterialStats } from "@/types/material";
import type { InventoryStats } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";

export default function MaterialHandling() {
  const { data: materialStats } = useQuery<MaterialStats>({
    queryKey: ['/api/material/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: inventoryStats } = useQuery<InventoryStats>({
    queryKey: ['/api/inventory/stats'],
    refetchInterval: 30000,
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
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <h3 className="text-2xl font-bold">{inventoryStats?.totalItems || 0}</h3>
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
                  <h3 className="text-2xl font-bold">{inventoryStats?.lowStockItems || 0}</h3>
                </div>
                <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <h3 className="text-2xl font-bold">{inventoryStats?.outOfStockItems || 0}</h3>
                </div>
                <FontAwesomeIcon icon="empty-set" className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(inventoryStats?.totalValue || 0)}</h3>
                </div>
                <FontAwesomeIcon icon="sack-dollar" className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4">
        <MaterialDashboard />
      </div>
    </div>
  );
}