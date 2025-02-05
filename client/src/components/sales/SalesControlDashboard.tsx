import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailDashboard } from "./email/EmailDashboard";
import { TaskManager } from "./tasks/TaskManager";
import { Textarea } from "@/components/ui/textarea";
import { HubspotIntegration } from "./integrations/HubspotIntegration";
import { MeetingScheduler } from "./meetings/MeetingScheduler";
import { AIInsightsDashboard } from "./insights/AIInsightsDashboard";
import { PipelineAnalytics } from "./pipeline/PipelineAnalytics";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealCard } from "./deals/DealCard";
import { useToast } from "@/hooks/use-toast";
import { OutlookIntegrationPanel } from "./integrations/OutlookIntegrationPanel";
import { PhoneIntegrationPanel } from "./integrations/PhoneIntegrationPanel";

const mockForecastData = {
  monthly: [
    { month: "Jan", actual: 45000, forecast: 42000, pipeline: 65000 },
    { month: "Feb", actual: 52000, forecast: 48000, pipeline: 72000 },
    { month: "Mar", actual: 48000, forecast: 51000, pipeline: 68000 },
    { month: "Apr", actual: 61000, forecast: 55000, pipeline: 85000 },
    { month: "May", actual: 55000, forecast: 58000, pipeline: 78000 },
    { month: "Jun", forecast: 62000, pipeline: 88000 },
    { month: "Jul", forecast: 65000, pipeline: 92000 },
    { month: "Aug", forecast: 68000, pipeline: 95000 },
    { month: "Sep", forecast: 71000, pipeline: 98000 },
    { month: "Oct", forecast: 74000, pipeline: 102000 },
    { month: "Nov", forecast: 77000, pipeline: 105000 },
    { month: "Dec", forecast: 80000, pipeline: 110000 }
  ],
  metrics: {
    currentQuarter: {
      forecast: 185000,
      pipeline: 255000,
      probability: 0.75,
      growth: 0.15
    },
    nextQuarter: {
      forecast: 210000,
      pipeline: 285000,
      probability: 0.65,
      growth: 0.18
    },
    yearEnd: {
      forecast: 850000,
      pipeline: 1200000,
      probability: 0.55,
      growth: 0.22
    }
  },
  topDeals: [
    {
      name: "TechCorp Automation",
      value: 75000,
      probability: 0.8,
      expectedClose: "2025-03-15"
    },
    {
      name: "Global Manufacturing Line",
      value: 120000,
      probability: 0.6,
      expectedClose: "2025-04-30"
    }
  ]
};

const mockSalesData = [
  { month: "Jan", revenue: 45000, deals: 12, conversion: 28 },
  { month: "Feb", revenue: 52000, deals: 15, conversion: 32 },
  { month: "Mar", revenue: 48000, deals: 14, conversion: 30 },
  { month: "Apr", revenue: 61000, deals: 18, conversion: 35 },
  { month: "May", revenue: 55000, deals: 16, conversion: 33 },
];

const mockPipelineStages = [
  { id: 1, name: "Lead", deals: 45, value: 280000 },
  { id: 2, name: "Meeting Scheduled", deals: 28, value: 420000 },
  { id: 3, name: "Proposal Sent", deals: 15, value: 380000 },
  { id: 4, name: "Contract Review", deals: 8, value: 250000 },
  { id: 5, name: "Closed Won", deals: 12, value: 580000 }
];

const mockDeals = [
  {
    id: 1,
    company: "TechCorp Industries",
    value: 75000,
    stage: "Proposal Sent",
    probability: 65,
    owner: "John Smith",
    manufacturingProject: "Custom Automation Line",
    lastContact: "2025-02-01",
    score: 85,
    qualificationStatus: "Highly Qualified",
    nextSteps: "Schedule technical review",
    engagement: "High",
    history: [
      {
        date: "2025-02-01",
        action: "Proposal sent to client",
        user: "John Smith"
      },
      {
        date: "2025-01-28",
        action: "Technical requirements finalized",
        user: "Sarah Johnson"
      }
    ],
    metrics: {
      daysInStage: 5,
      lastActivityDate: "2025-02-01",
      meetingsScheduled: 3,
      documentsShared: 2
    }
  },
  {
    id: 2,
    company: "Global Manufacturing Co",
    value: 120000,
    stage: "Contract Review",
    probability: 85,
    owner: "Sarah Johnson",
    manufacturingProject: "Assembly System Upgrade",
    lastContact: "2025-02-03",
    score: 92,
    qualificationStatus: "Qualified",
    nextSteps: "Final contract review",
    engagement: "Very High",
    history: [
      {
        date: "2025-02-03",
        action: "Contract draft reviewed",
        user: "Sarah Johnson"
      },
      {
        date: "2025-02-01",
        action: "Pricing negotiation completed",
        user: "Sarah Johnson"
      }
    ],
    metrics: {
      daysInStage: 2,
      lastActivityDate: "2025-02-03",
      meetingsScheduled: 4,
      documentsShared: 3
    }
  }
];

const mockContacts = [
  {
    id: 1,
    name: "Michael Chen",
    title: "Procurement Director",
    company: "TechCorp Industries",
    email: "m.chen@techcorp.com",
    phone: "+1 (555) 123-4567",
    lastContact: "2025-02-01",
    deals: 3
  },
  {
    id: 2,
    name: "Lisa Rodriguez",
    title: "Operations Manager",
    company: "Global Manufacturing Co",
    email: "l.rodriguez@globalmfg.com",
    phone: "+1 (555) 987-6543",
    lastContact: "2025-02-03",
    deals: 2
  }
];

export function SalesControlDashboard() {
  const [pipelineTimeframe, setPipelineTimeframe] = useState("30d");
  const [forecastTimeframe, setForecastTimeframe] = useState("monthly");
  const [showPipeline, setShowPipeline] = useState(true);
  const { toast } = useToast();

  const handleDealEdit = async (id: number, updatedData: any) => {
    try {
      console.log('Edit deal:', id, updatedData);
      toast({
        title: "Success",
        description: "Deal updated successfully",
      });
    } catch (error) {
      console.error('Failed to update deal:', error);
      toast({
        title: "Error",
        description: "Failed to update deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <FontAwesomeIcon
              icon="handshake"
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
              icon="dollar-sign"
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
              icon="chart-line"
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
              icon="bullseye"
              className="h-4 w-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$48.5K</div>
            <p className="text-xs text-muted-foreground">+5K from last quarter</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing Projects</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
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

        <TabsContent value="pipeline" className="space-y-4">
          <PipelineAnalytics
            stages={mockPipelineStages}
            timeframe={pipelineTimeframe}
            onTimeframeChange={setPipelineTimeframe}
          />
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mockPipelineStages.map((stage) => (
                  <div key={stage.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{stage.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stage.deals} deals · ${stage.value.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{Math.round((stage.deals / 45) * 100)}%</Badge>
                    </div>
                    <Progress value={(stage.deals / 45) * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Deals</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and track your sales pipeline
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <FontAwesomeIcon icon="handshake" className="mr-2" />
                    New Deal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Deal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" placeholder="Enter company name" />
                      </div>
                      <div>
                        <Label htmlFor="value">Deal Value</Label>
                        <Input id="value" type="number" placeholder="Enter deal value" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stage">Stage</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="meeting">Meeting Scheduled</SelectItem>
                            <SelectItem value="proposal">Proposal Sent</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="closed">Closed Won</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="owner">Owner</Label>
                        <Input id="owner" placeholder="Assign deal owner" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="manufacturingProject">Manufacturing Project</Label>
                      <Input
                        id="manufacturingProject"
                        placeholder="Enter project details"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qualification">Qualification Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="highly-qualified">Highly Qualified</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="partially-qualified">Partially Qualified</SelectItem>
                          <SelectItem value="unqualified">Unqualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nextSteps">Next Steps</Label>
                      <Textarea
                        id="nextSteps"
                        placeholder="Define next steps and action items"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Deal</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search deals..."
                      className="max-w-sm"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="meeting">Meeting Scheduled</SelectItem>
                      <SelectItem value="proposal">Proposal Sent</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed">Closed Won</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest-value">Highest Value</SelectItem>
                      <SelectItem value="lowest-value">Lowest Value</SelectItem>
                      <SelectItem value="highest-score">Highest Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onEdit={handleDealEdit}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contacts</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <FontAwesomeIcon icon="user-tie" className="mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Active Deals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={`https://avatar.vercel.sh/${contact.name}`} />
                            <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell>{contact.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon="building" className="text-muted-foreground" />
                          {contact.company}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon="phone" className="text-muted-foreground" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon="envelope" className="text-muted-foreground" />
                            {contact.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(contact.lastContact).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge>{contact.deals} deals</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailDashboard />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Sales Forecast</h2>
              <p className="text-muted-foreground">
                Revenue predictions and pipeline analysis
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={forecastTimeframe} onValueChange={setForecastTimeframe}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly View</SelectItem>
                  <SelectItem value="quarterly">Quarterly View</SelectItem>
                  <SelectItem value="yearly">Yearly View</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowPipeline(!showPipeline)}
              >
                <FontAwesomeIcon
                  icon="chart-line"
                  className={`mr-2 ${showPipeline ? 'text-primary' : ''}`}
                />
                Pipeline Overlay
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Forecast</span>
                    <span className="font-bold">
                      ${mockForecastData.metrics.currentQuarter.forecast.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pipeline</span>
                    <span className="font-bold">
                      ${mockForecastData.metrics.currentQuarter.pipeline.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Probability</span>
                    <Badge variant="secondary">
                      {(mockForecastData.metrics.currentQuarter.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Growth</span>
                    <Badge variant="default" className="bg-green-500">
                      +{(mockForecastData.metrics.currentQuarter.growth * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Forecast</span>
                    <span className="font-bold">
                      ${mockForecastData.metrics.nextQuarter.forecast.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pipeline</span>
                    <span className="font-bold">
                      ${mockForecastData.metrics.nextQuarter.pipeline.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Probability</span>
                    <Badge variant="secondary">
                      {(mockForecastData.metrics.nextQuarter.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Growth</span>
                    <Badge variant="default" className="bg-green-500">
                      +{(mockForecastData.metrics.nextQuarter.growth * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Year-End Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Forecast</span>
                    <span className="font-bold">
                      ${mockForecastData.metrics.yearEnd.forecast.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pipeline</span>
                    <span className="font-bold">
                      ${mockForecastData.metrics.yearEnd.pipeline.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Probability</span>
                    <Badge variant="secondary">
                      {(mockForecastData.metrics.yearEnd.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Growth</span>
                    <Badge variant="default" className="bg-green-500">
                      +{(mockForecastData.metrics.yearEnd.growth * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockForecastData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecasted Revenue"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  {showPipeline && (
                    <Line
                      type="monotone"
                      dataKey="pipeline"
                      name="Pipeline Revenue"
                      stroke="#ffc658"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Deal Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Expected Close</TableHead>
                    <TableHead>Weighted Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockForecastData.topDeals.map((deal) => (
                    <TableRow key={deal.name}>
                      <TableCell>{deal.name}</TableCell>
                      <TableCell>${deal.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {(deal.probability * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(deal.expectedClose).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold">
                        ${(deal.value * deal.probability).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manufacturing" className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Manufacturing Projects</CardTitle>
              <Button variant="outline">
                <FontAwesomeIcon icon="project-diagram" className="mr-2" />
                Link to Deal
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Associated Deal</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Custom Automation Line</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">In Progress</Badge>
                    </TableCell>
                    <TableCell>Q2 2025</TableCell>
                    <TableCell>TechCorp Industries</TableCell>
                    <TableCell>$75,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Assembly System Upgrade</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Planning</Badge>
                    </TableCell>
                    <TableCell>Q3 2025</TableCell>
                    <TableCell>Global Manufacturing Co</TableCell>
                    <TableCell>$120,000</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="integrations" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Integrations</h2>
            <p className="text-muted-foreground">
              Connect your communication tools to automatically track project discussions
            </p>

            <div className="grid gap-4">
              <OutlookIntegrationPanel
                onIntegrationUpdate={(status) => {
                  if (status) {
                    toast({
                      title: "Integration Updated",
                      description: "Outlook integration is now active",
                    });
                  }
                }}
              />

              <PhoneIntegrationPanel
                onIntegrationUpdate={(status) => {
                  if (status) {
                    toast({
                      title: "Integration Updated",
                      description: "Phone integration is now active",
                    });
                  }
                }}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="meetings" className="space-y-4">
          <MeetingScheduler />
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <AIInsightsDashboard
            currentDeal={mockDeals[0]}
            salesData={{
              deals: mockDeals,
              pipeline: mockPipelineStages,
              performance: mockSalesData
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}