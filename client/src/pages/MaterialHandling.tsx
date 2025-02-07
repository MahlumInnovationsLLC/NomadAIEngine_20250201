
import { MaterialDashboard } from "@/components/material/MaterialDashboard";

export default function MaterialHandling() {
  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-2">Material Handling</h1>
        <p className="text-muted-foreground mb-4">
          Manage inventory, warehouses, and material movements
        </p>
      </div>

      <div className="p-4">
        <MaterialDashboard />
      </div>
    </div>
  );
}
