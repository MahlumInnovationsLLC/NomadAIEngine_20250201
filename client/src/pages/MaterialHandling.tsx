import { MaterialDashboard } from "@/components/material/MaterialDashboard";

export default function MaterialHandling() {
  return (
    <div className="container mx-auto">
      <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-4">Material Handling & Supply Chain</h1>
        <p className="text-muted-foreground mb-8">
          Comprehensive inventory management and supply chain optimization system for efficient resource allocation
        </p>
      </div>

      <div className="p-4">
        <MaterialDashboard />
      </div>
    </div>
  );
}