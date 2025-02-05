
import { Card } from "@/components/ui/card";
import type { SupplyChainMetrics } from "@/types/material";

interface SupplyChainViewProps {
  metrics?: SupplyChainMetrics;
}

export function SupplyChainView({ metrics }: SupplyChainViewProps) {
  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Supply Chain Overview</h2>
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold">{metrics.activeOrders}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className="text-2xl font-bold">{metrics.healthScore}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On-Time Delivery</p>
              <p className="text-2xl font-bold">{metrics.onTimeDelivery}%</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
