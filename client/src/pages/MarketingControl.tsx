import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { MarketingCalendar } from "@/components/marketing/calendar/MarketingCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MarketingControl() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Control</h1>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <MarketingDashboard />
        </TabsContent>
        <TabsContent value="calendar" className="space-y-4">
          <MarketingCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}