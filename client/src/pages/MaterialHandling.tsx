import MaterialDashboard from "@/components/material/MaterialDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

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
        <MaterialDashboard />
      </div>
    </div>
  );
}