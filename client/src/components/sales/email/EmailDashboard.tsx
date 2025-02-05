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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  faEnvelope,
  faEye,
  faPaperPlane,
  faCheck,
  faClock,
  faUser,
  faCalendarAlt,
  faBuilding,
  faPlus,
  faEdit,
  faTrash,
  faChartLine,
  faSync,
  faStar
} from "@fortawesome/free-solid-svg-icons";

// Mock data for demonstration
const mockEmailTemplates = [
  {
    id: 1,
    name: "Initial Contact",
    subject: "Discussing Manufacturing Solutions for [Company]",
    body: "Dear [Name],\n\nI hope this email finds you well...",
    usageCount: 45,
    openRate: "68%",
    category: "sales",
    lastModified: "2025-02-04"
  },
  {
    id: 2,
    name: "Follow-up Meeting",
    subject: "Next Steps - [Company] Manufacturing Project",
    body: "Hi [Name],\n\nThank you for your time yesterday...",
    usageCount: 32,
    openRate: "75%",
    category: "follow-up",
    lastModified: "2025-02-03"
  }
];

const mockEmailActivity = [
  {
    id: 1,
    recipient: "Michael Chen",
    recipientEmail: "michael.chen@techcorp.com",
    company: "TechCorp Industries",
    subject: "Manufacturing Solutions Proposal",
    sentAt: "2025-02-04T10:30:00",
    status: "opened",
    openCount: 3,
    clickRate: "15%",
    scheduledFor: null
  },
  {
    id: 2,
    recipient: "Lisa Rodriguez",
    recipientEmail: "l.rodriguez@globalmanufacturing.com",
    company: "Global Manufacturing Co",
    subject: "Follow-up: Assembly System Discussion",
    sentAt: "2025-02-04T14:15:00",
    status: "sent",
    openCount: 0,
    clickRate: "0%",
    scheduledFor: "2025-02-06T09:00:00"
  }
];

const mockAnalytics = {
  totalSent: 156,
  openRate: "42%",
  clickRate: "12%",
  responseRate: "8%",
  avgResponseTime: "3.2 hours",
  bestTimeToSend: "Tuesday 10:00 AM",
  topPerformingSubject: "Manufacturing Solutions Proposal",
};

export function EmailDashboard() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async (data) => {
    try {
      // Here we would integrate with Azure Email service
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

  const handleScheduleEmail = async (data) => {
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
          <p className="text-muted-foreground">Manage and track your sales emails</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
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
                      <FontAwesomeIcon icon={faPlus} />
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
                      {mockEmailTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
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
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Save Draft</Button>
                <Button onClick={handleSendEmail}>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Send Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
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
                    <span>Open Rate</span>
                    <Badge variant="default">{mockAnalytics.openRate}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Click Rate</span>
                    <Badge variant="default">{mockAnalytics.clickRate}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Response Rate</span>
                    <Badge variant="default">{mockAnalytics.responseRate}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Best Sending Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Best Time</span>
                    <Badge variant="default">{mockAnalytics.bestTimeToSend}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Response Time</span>
                    <Badge variant="default">{mockAnalytics.avgResponseTime}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Subject Line</span>
                    <p className="font-medium">{mockAnalytics.topPerformingSubject}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Email Templates</CardTitle>
              <Button onClick={() => setShowTemplateEditor(true)}>
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New Template
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmailTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {template.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.usageCount} times</TableCell>
                      <TableCell>{template.openRate}</TableCell>
                      <TableCell>{new Date(template.lastModified).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent/Scheduled</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmailActivity.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{email.recipient}</div>
                          <div className="text-sm text-muted-foreground">{email.company}</div>
                        </div>
                      </TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>
                        <Badge variant={email.status === 'opened' ? 'default' : 'secondary'}>
                          <FontAwesomeIcon
                            icon={email.status === 'opened' ? faEye : faClock}
                            className="mr-1"
                          />
                          {email.status === 'opened' ? `Opened (${email.openCount}x)` : 'Sent'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {email.scheduledFor
                          ? `Scheduled for ${new Date(email.scheduledFor).toLocaleString()}`
                          : new Date(email.sentAt).toLocaleString()
                        }
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">Click Rate: {email.clickRate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={faSync} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Total Sent</div>
                    <div className="text-3xl font-bold">{mockAnalytics.totalSent}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Open Rate</div>
                    <div className="text-3xl font-bold">{mockAnalytics.openRate}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Click Rate</div>
                    <div className="text-3xl font-bold">{mockAnalytics.clickRate}</div>
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