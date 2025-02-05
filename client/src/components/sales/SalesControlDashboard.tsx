import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faHandshake,
  faDollarSign,
  faUsers,
  faBullseye,
  faFileContract,
  faRocket,
  faGears
} from "@fortawesome/free-solid-svg-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const mockSalesData = [
  { month: "Jan", revenue: 45000, deals: 12, conversion: 28 },
  { month: "Feb", revenue: 52000, deals: 15, conversion: 32 },
  { month: "Mar", revenue: 48000, deals: 14, conversion: 30 },
  { month: "Apr", revenue: 61000, deals: 18, conversion: 35 },
  { month: "May", revenue: 55000, deals: 16, conversion: 33 },
];

export function SalesControlDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <FontAwesomeIcon 
              icon={faHandshake}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <FontAwesomeIcon 
              icon={faDollarSign}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.2M</div>
            <p className="text-xs text-muted-foreground">+$200K from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <FontAwesomeIcon 
              icon={faChartLine}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32%</div>
            <p className="text-xs text-muted-foreground">+2.4% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <FontAwesomeIcon 
              icon={faBullseye}
              className="h-4 w-4 text-muted-foreground" 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$48.5K</div>
            <p className="text-xs text-muted-foreground">+5K from last quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mockSalesData}>
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue ($)"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary"
                  />
                  <Bar 
                    dataKey="deals" 
                    name="Deals Closed"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary/50" 
                  />
                  <Bar 
                    dataKey="conversion" 
                    name="Conversion Rate %"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary/20" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tab contents will be implemented next */}
        <TabsContent value="pipeline" className="space-y-4">
          {/* Pipeline management component will go here */}
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          {/* Deals management component will go here */}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {/* Contacts management component will go here */}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          {/* Sales forecasting component will go here */}
        </TabsContent>

        <TabsContent value="manufacturing" className="space-y-4">
          {/* Manufacturing projects integration will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
