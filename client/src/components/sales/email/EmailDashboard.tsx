import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Import our new components
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { EmailCampaignPanel } from "./EmailCampaignPanel";

// Add to imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  schedule: string;
  targetAudience: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    responded: number;
  };
}

const mockEmailAnalytics = {
  sent: 156,
  opened: 89,
  clicked: 34,
  responded: 12,
  averageResponseTime: "3.2 hours",
  bestTimeToSend: "Tuesday 10:00 AM",
  topPerformingSubject: "Manufacturing Solutions Proposal",
};

// Add mock data for analytics
const mockPerformanceData = [
  { date: '2025-01-01', sent: 45, opened: 30, clicked: 15, responded: 8 },
  { date: '2025-01-02', sent: 52, opened: 35, clicked: 18, responded: 10 },
  { date: '2025-01-03', sent: 48, opened: 32, clicked: 20, responded: 12 },
  { date: '2025-01-04', sent: 70, opened: 45, clicked: 25, responded: 15 },
  { date: '2025-01-05', sent: 65, opened: 40, clicked: 22, responded: 13 },
];

const mockCampaignComparison = [
  {
    name: 'Product Launch',
    openRate: 65,
    clickRate: 42,
    responseRate: 28,
  },
  {
    name: 'Follow-up',
    openRate: 72,
    clickRate: 38,
    responseRate: 25,
  },
  {
    name: 'Newsletter',
    openRate: 58,
    clickRate: 35,
    responseRate: 20,
  },
];

export function EmailDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();

  const handleSendEmail = async (data: any) => {
    try {
      // Here we would integrate with email service
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const handleScheduleEmail = async () => {
    try {
      toast({
        title: "Success",
        description: "Email scheduled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Communications</h2>
          <p className="text-muted-foreground">
            Manage campaigns, templates, and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FontAwesomeIcon icon="paper-plane" className="mr-2" />
                New Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipients">To</Label>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="michael.chen@techcorp.com">Michael Chen - TechCorp</SelectItem>
                        <SelectItem value="l.rodriguez@globalmanufacturing.com">Lisa Rodriguez - Global Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <FontAwesomeIcon icon="plus" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Enter email subject" />
                </div>
                <div>
                  <Label>Template</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Template options will be populated dynamically */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={6} className="min-h-[200px]" />
                </div>
                <div>
                  <Label>Schedule</Label>
                  <div className="flex gap-2">
                    <Input type="datetime-local" className="w-full" />
                    <Button variant="outline" onClick={handleScheduleEmail}>
                      <FontAwesomeIcon icon="clock" className="mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Save Draft</Button>
                <Button onClick={handleSendEmail}>
                  <FontAwesomeIcon icon="paper-plane" className="mr-2" />
                  Send Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Email Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Emails Sent</span>
                    <Badge variant="default">{mockEmailAnalytics.sent}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Open Rate</span>
                    <Badge variant="default">
                      {((mockEmailAnalytics.opened / mockEmailAnalytics.sent) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Click Rate</span>
                    <Badge variant="default">
                      {((mockEmailAnalytics.clicked / mockEmailAnalytics.sent) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Response Rate</span>
                    <Badge variant="default">
                      {((mockEmailAnalytics.responded / mockEmailAnalytics.sent) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Response Time</span>
                    <Badge variant="default">{mockEmailAnalytics.averageResponseTime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Best Send Time</span>
                    <Badge variant="default">{mockEmailAnalytics.bestTimeToSend}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Subject Line</span>
                    <p className="font-medium">{mockEmailAnalytics.topPerformingSubject}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <EmailCampaignPanel />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateEditor />
        </TabsContent>

        {/* Replace the analytics TabsContent with: */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                        <Line type="monotone" dataKey="opened" stroke="#82ca9d" name="Opened" />
                        <Line type="monotone" dataKey="clicked" stroke="#ffc658" name="Clicked" />
                        <Line type="monotone" dataKey="responded" stroke="#ff7300" name="Responded" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockCampaignComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="openRate" fill="#8884d8" name="Open Rate %" />
                        <Bar dataKey="clickRate" fill="#82ca9d" name="Click Rate %" />
                        <Bar dataKey="responseRate" fill="#ffc658" name="Response Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Best Performing Time</h4>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon="clock" className="text-muted-foreground" />
                        <span>Tuesday 10:00 AM</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Emails sent at this time have 45% higher open rates
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Top Subject Line</h4>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon="envelope" className="text-muted-foreground" />
                        <span>"New Manufacturing Solutions"</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        72% open rate with this subject line
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Best Call-to-Action</h4>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon="mouse-pointer" className="text-muted-foreground" />
                        <span>"Schedule Demo"</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        38% click-through rate
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <FontAwesomeIcon icon="lightbulb" className="text-yellow-500" />
                        <span>Schedule emails for Tuesday morning to maximize engagement</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FontAwesomeIcon icon="lightbulb" className="text-yellow-500" />
                        <span>Include product name in subject lines for higher open rates</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FontAwesomeIcon icon="lightbulb" className="text-yellow-500" />
                        <span>Use action-oriented CTAs for better click-through rates</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}