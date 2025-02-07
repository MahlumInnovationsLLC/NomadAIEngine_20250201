import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CampaignManager } from "./CampaignManager";
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
    <div className="space-y-6">
      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="home" className="mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <FontAwesomeIcon icon="bullhorn" className="mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments">
            <FontAwesomeIcon icon="users" className="mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <FontAwesomeIcon icon="chart-pie" className="mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <FontAwesomeIcon icon="plug" className="mr-2" />
            Integrations
          </TabsTrigger>
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