
import { FieldServiceDashboard } from "@/components/field-service/FieldServiceDashboard";

export default function FieldServicePage() {
  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-3xl font-bold mb-2">Field Service & Warranty</h1>
        <p className="text-muted-foreground mb-4">
          Manage service tickets, warranty claims, and field technicians
        </p>
      </div>

      <div className="p-4">
        <FieldServiceDashboard />
      </div>
    </div>
  );
}
