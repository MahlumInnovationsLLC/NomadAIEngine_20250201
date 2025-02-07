import MaterialDashboard from "@/components/material/MaterialDashboard";

export default function MaterialHandling() {
  return (
    <div className="container mx-auto">
      <div className="py-6 border-b">
        <div className="container px-4">
          <h1 className="text-3xl font-bold mb-2">Material Handling & Supply Chain</h1>
          <p className="text-muted-foreground">
            Comprehensive inventory management and supply chain optimization system for efficient resource allocation
          </p>
        </div>
      </div>

      <div className="p-4">
        <MaterialDashboard />
      </div>
    </div>
  );
}