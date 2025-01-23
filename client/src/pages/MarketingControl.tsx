import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";

export default function MarketingControl() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Control</h1>
      </div>
      <MarketingDashboard />
    </div>
  );
}
