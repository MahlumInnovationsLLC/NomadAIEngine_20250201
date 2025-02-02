import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CampaignManager } from "./CampaignManager";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { CampaignMetrics } from "./analytics/CampaignMetrics";
import { IntegrationsPanel } from "./integrations/IntegrationsPanel";
import { CustomerSegmentation } from "./segmentation/CustomerSegmentation";
import { faUsers, faChartLine, faBullhorn, faEnvelope, faDollarSign } from "@fortawesome/free-solid-svg-icons";

const campaignData = [
  { month: "Jan", engagement: 400, conversions: 240, roi: 180 },
  { month: "Feb", engagement: 300, conversions: 139, roi: 120 },
  { month: "Mar", engagement: 200, conversions: 980, roi: 200 },
  { month: "Apr", engagement: 278, conversions: 390, roi: 250 },
  { month: "May", engagement: 189, conversions: 480, roi: 190 },
];

export function MarketingDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <FontAwesomeIcon 
              icon={faBullhorn}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Engagement</CardTitle>
            <FontAwesomeIcon 
              icon={faEnvelope}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <FontAwesomeIcon 
              icon={faChartLine}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">+0.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketing ROI</CardTitle>
            <FontAwesomeIcon 
              icon={faDollarSign}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">246%</div>
            <p className="text-xs text-muted-foreground">+23% from last quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={campaignData}>
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="engagement" 
                    name="Engagement"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary"
                  />
                  <Bar 
                    dataKey="conversions" 
                    name="Conversions"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary/50" 
                  />
                  <Bar 
                    dataKey="roi" 
                    name="ROI %"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary/20" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <CustomerSegmentation />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <CampaignMetrics />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}