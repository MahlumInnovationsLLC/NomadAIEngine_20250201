
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { MarketingCalendar } from "@/components/marketing/calendar/MarketingCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MarketingControl() {
  return (
    <div className="container mx-auto pt-16">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6">
        <div className="px-4">
          <h1 className="text-3xl font-bold mb-1">Marketing Control</h1>
          <p className="text-muted-foreground mb-4">
            Manage your marketing campaigns and analytics
          </p>
        </div>
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
