import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RichTextEditor } from "./RichTextEditor";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Enhanced campaign schema
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Email subject is required"),
  template: z.string().min(1, "Template selection is required"),
  schedule: z.string().min(1, "Schedule is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  content: z.string().optional(),
  sendTime: z.string().optional(),
  frequency: z.string().optional(),
});

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  schedule: string;
  targetAudience: string;
  content?: string;
  sendTime?: string;
  frequency?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    responded: number;
    bounced: number;
    performance: Array<{
      date: string;
      opens: number;
      clicks: number;
      responses: number;
    }>;
  };
}

// Mock data with enhanced statistics
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "New Product Launch",
    subject: "Introducing Our Latest Manufacturing Solution",
    template: "product_launch",
    status: "scheduled",
    schedule: "2025-03-01",
    targetAudience: "Manufacturing Executives",
    content: "Dear {customer_name},\n\nWe're excited to introduce our latest manufacturing solution...",
    sendTime: "10:00 AM",
    frequency: "one-time",
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0,
      responded: 0,
      bounced: 0,
      performance: []
    }
  },
  {
    id: "2",
    name: "Follow-up Campaign",
    subject: "Your Custom Manufacturing Solution Awaits",
    template: "follow_up",
    status: "active",
    schedule: "2025-02-15",
    targetAudience: "Warm Leads",
    sendTime: "2:00 PM",
    frequency: "weekly",
    stats: {
      sent: 145,
      opened: 89,
      clicked: 34,
      responded: 12,
      bounced: 3,
      performance: [
        { date: '2025-02-15', opens: 45, clicks: 20, responses: 8 },
        { date: '2025-02-16', opens: 30, clicks: 15, responses: 5 },
        { date: '2025-02-17', opens: 25, clicks: 12, responses: 4 }
      ]
    }
  }
];

export function EmailCampaignPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      template: "",
      schedule: "",
      targetAudience: "",
      content: "",
      sendTime: "",
      frequency: "one-time",
    },
  });

  const handleCreateCampaign = (data: z.infer<typeof campaignSchema>) => {
    const newCampaign: Campaign = {
      id: (campaigns.length + 1).toString(),
      name: data.name,
      subject: data.subject,
      template: data.template,
      status: 'draft',
      schedule: data.schedule,
      targetAudience: data.targetAudience,
      content: data.content,
      sendTime: data.sendTime,
      frequency: data.frequency,
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        responded: 0,
        bounced: 0,
        performance: []
      }
    };

    setCampaigns([...campaigns, newCampaign]);
    toast({
      title: "Campaign Created",
      description: "New email campaign has been created successfully",
    });
  };

  const handleUpdateCampaign = (campaignId: string, status: Campaign['status']) => {
    setCampaigns(campaigns.map(campaign => 
      campaign.id === campaignId
        ? { ...campaign, status }
        : campaign
    ));
    toast({
      title: "Campaign Updated",
      description: `Campaign status updated to ${status}`,
    });
  };

  const getStatusBadgeVariant = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'completed': return 'outline';
      case 'paused': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Campaign Button */}
      <div className="flex justify-between items-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FontAwesomeIcon icon={['fal', 'plus']} className="mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateCampaign)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input id="subject" {...form.register("subject")} />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select onValueChange={(value) => form.setValue("template", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_launch">Product Launch</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="nurture">Nurture Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schedule</Label>
                <Input type="date" {...form.register("schedule")} />
              </div>

              <div className="space-y-2">
                <Label>Send Time</Label>
                <Input type="time" {...form.register("sendTime")} />
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select onValueChange={(value) => form.setValue("frequency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One Time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select onValueChange={(value) => form.setValue("targetAudience", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="manufacturing_executives">Manufacturing Executives</SelectItem>
                    <SelectItem value="warm_leads">Warm Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  content={form.watch("content") || ""}
                  onChange={(content) => form.setValue("content", content)}
                  variables={["customer_name", "company_name", "product_name"]}
                />
              </div>

              <DialogFooter>
                <Button type="submit">Create Campaign</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{campaign.schedule}</div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.sendTime} ({campaign.frequency})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs">
                        Sent: {campaign.stats.sent} | Opened: {campaign.stats.opened}
                      </div>
                      <div className="text-xs">
                        Clicked: {campaign.stats.clicked} | Responded: {campaign.stats.responded}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <FontAwesomeIcon icon={['fal', 'eye']} className="mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsEditOpen(true);
                        }}
                      >
                        <FontAwesomeIcon icon={['fal', 'edit']} className="mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsAnalyticsOpen(true);
                        }}
                      >
                        <FontAwesomeIcon icon={['fal', 'chart-line']} className="mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campaign Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm">{selectedCampaign.name}</p>
              </div>
              <div>
                <Label>Subject</Label>
                <p className="text-sm">{selectedCampaign.subject}</p>
              </div>
              <div>
                <Label>Content</Label>
                <div className="p-4 border rounded-lg whitespace-pre-wrap">
                  {selectedCampaign.content}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Schedule</Label>
                  <p className="text-sm">{selectedCampaign.schedule}</p>
                </div>
                <div>
                  <Label>Send Time</Label>
                  <p className="text-sm">{selectedCampaign.sendTime}</p>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <p className="text-sm">{selectedCampaign.frequency}</p>
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <p className="text-sm">{selectedCampaign.targetAudience}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedCampaign.stats.sent}</div>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {((selectedCampaign.stats.opened / selectedCampaign.stats.sent) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {((selectedCampaign.stats.clicked / selectedCampaign.stats.sent) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {((selectedCampaign.stats.responded / selectedCampaign.stats.sent) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedCampaign.stats.performance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="opens" stroke="#8884d8" name="Opens" />
                        <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
                        <Line type="monotone" dataKey="responses" stroke="#ffc658" name="Responses" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}