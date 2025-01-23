import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Progress } from "@/components/ui/progress";

// Mock data - Replace with actual API data
const campaignData = {
  monthlyStats: [
    { month: 'Jan', engagement: 65, conversions: 40, revenue: 2400 },
    { month: 'Feb', engagement: 78, conversions: 52, revenue: 3200 },
    { month: 'Mar', engagement: 82, conversions: 58, revenue: 4100 },
    { month: 'Apr', engagement: 70, conversions: 45, revenue: 3100 },
  ],
  channelDistribution: [
    { name: 'Email', value: 45 },
    { name: 'Social', value: 30 },
    { name: 'Display', value: 15 },
    { name: 'Other', value: 10 },
  ],
  kpis: {
    totalCampaigns: 24,
    activeSubscribers: 12500,
    averageOpenRate: 28.5,
    conversionRate: 3.2,
    roi: 320
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function CampaignMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <FontAwesomeIcon
              icon={['fal', 'bullhorn']}
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignData.kpis.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subscribers
            </CardTitle>
            <FontAwesomeIcon
              icon={['fal', 'users']}
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignData.kpis.activeSubscribers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +5.2% growth rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            <FontAwesomeIcon
              icon={['fal', 'envelope-open']}
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignData.kpis.averageOpenRate}%
            </div>
            <Progress value={campaignData.kpis.averageOpenRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <FontAwesomeIcon
              icon={['fal', 'chart-line']}
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignData.kpis.roi}%
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={campaignData.monthlyStats}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="engagement" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="conversions" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campaignData.channelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {campaignData.channelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={campaignData.monthlyStats}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Conversion Rate</p>
                  <p className="text-xs text-muted-foreground">
                    Overall campaign effectiveness
                  </p>
                </div>
                <span className="text-2xl font-bold">{campaignData.kpis.conversionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Engagement Score</p>
                  <p className="text-xs text-muted-foreground">
                    Based on clicks and interactions
                  </p>
                </div>
                <Progress value={82} className="w-[60px]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Customer Satisfaction</p>
                  <p className="text-xs text-muted-foreground">
                    Based on feedback and surveys
                  </p>
                </div>
                <Progress value={94} className="w-[60px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
