import { FieldServiceDashboard } from "@/components/field-service/FieldServiceDashboard";

export default function FieldServicePage() {
  return (
    <div className="container mx-auto">
      <div className="py-6 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="px-4">
          <h1 className="text-3xl font-bold mb-2">Field Service & Warranty</h1>
          <p className="text-muted-foreground">
            Manage service tickets, warranty claims, and field technicians
          </p>
        </div>
      </div>

      <div className="p-4">
        <FieldServiceDashboard />
      </div>
    </div>
  );
}