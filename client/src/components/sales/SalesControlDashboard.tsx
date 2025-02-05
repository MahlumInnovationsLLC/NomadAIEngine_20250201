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
  faGears,
  faIndustry,
  faProjectDiagram,
  faCog,
  faUserTie,
  faBuilding,
  faPhone,
  faEnvelope
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
    engagement: "High"
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
    engagement: "Very High"
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
                    <FontAwesomeIcon icon={faHandshake} className="mr-2" />
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
                      onEdit={(id) => {
                        // Handle deal edit
                        console.log('Edit deal:', id);
                      }}
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
                    <FontAwesomeIcon icon={faUserTie} className="mr-2" />
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
                    {/* Add more fields as needed */}
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
                          <FontAwesomeIcon icon={faBuilding} className="text-muted-foreground" />
                          {contact.company}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faPhone} className="text-muted-foreground" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faEnvelope} className="text-muted-foreground" />
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
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={mockSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#8884d8" />
                  <Line type="monotone" dataKey="deals" name="Projected Revenue" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manufacturing" className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Manufacturing Projects</CardTitle>
              <Button variant="outline">
                <FontAwesomeIcon icon={faProjectDiagram} className="mr-2" />
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
          <HubspotIntegration />
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