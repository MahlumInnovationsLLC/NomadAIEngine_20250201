import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { MarketingCalendar } from "@/components/marketing/calendar/MarketingCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

interface MarketingStats {
  activeCampaigns: number;
  emailEngagement: number;
  conversionRate: number;
  marketingROI: number;
}

export default function MarketingControl() {
  const { data: stats } = useQuery<MarketingStats>({
    queryKey: ['/api/marketing/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Marketing Control</h1>
          <p className="text-muted-foreground mb-4">
            Manage your marketing campaigns and analytics
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                    <h3 className="text-2xl font-bold">{stats?.activeCampaigns || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="bullhorn" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email Engagement</p>
                    <h3 className="text-2xl font-bold">{stats?.emailEngagement || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="envelope" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <h3 className="text-2xl font-bold">{stats?.conversionRate || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marketing ROI</p>
                    <h3 className="text-2xl font-bold">{stats?.marketingROI || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="dollar-sign" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="dashboard">
                <FontAwesomeIcon icon="chart-bar" className="mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <FontAwesomeIcon icon="calendar" className="mr-2" />
                Calendar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-4">
              <MarketingDashboard />
            </TabsContent>
            <TabsContent value="calendar" className="space-y-4">
              <MarketingCalendar />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimateTransition>
  );
}