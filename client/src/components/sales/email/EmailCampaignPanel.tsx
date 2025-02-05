import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Email subject is required"),
  template: z.string().min(1, "Template selection is required"),
  schedule: z.string().min(1, "Schedule is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
});

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

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "New Product Launch",
    subject: "Introducing Our Latest Manufacturing Solution",
    template: "product_launch",
    status: "scheduled",
    schedule: "2025-03-01",
    targetAudience: "Manufacturing Executives",
    stats: { sent: 0, opened: 0, clicked: 0, responded: 0 }
  },
  {
    id: "2",
    name: "Follow-up Campaign",
    subject: "Your Custom Manufacturing Solution Awaits",
    template: "follow_up",
    status: "active",
    schedule: "2025-02-15",
    targetAudience: "Warm Leads",
    stats: { sent: 145, opened: 89, clicked: 34, responded: 12 }
  }
];

export function EmailCampaignPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      template: "",
      schedule: "",
      targetAudience: "",
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
      stats: { sent: 0, opened: 0, clicked: 0, responded: 0 }
    };

    setCampaigns([...campaigns, newCampaign]);
    toast({
      title: "Campaign Created",
      description: "New email campaign has been created successfully",
    });
  };

  const handlePreviewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsPreviewOpen(true);
  };

  const getStatusColor = (status: Campaign['status']): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage automated email campaigns
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FontAwesomeIcon icon="plus" className="mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateCampaign)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input 
                  id="subject" 
                  {...form.register("subject")}
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select onValueChange={(value) => form.setValue("template", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_launch">Product Launch</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="custom">Custom Template</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.template && (
                  <p className="text-sm text-red-500">{form.formState.errors.template.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input 
                  id="schedule" 
                  type="datetime-local" 
                  {...form.register("schedule")}
                />
                {form.formState.errors.schedule && (
                  <p className="text-sm text-red-500">{form.formState.errors.schedule.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select onValueChange={(value) => form.setValue("targetAudience", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_contacts">All Contacts</SelectItem>
                    <SelectItem value="manufacturing_executives">Manufacturing Executives</SelectItem>
                    <SelectItem value="warm_leads">Warm Leads</SelectItem>
                    <SelectItem value="custom_segment">Custom Segment</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.targetAudience && (
                  <p className="text-sm text-red-500">{form.formState.errors.targetAudience.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit">Create Campaign</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Target Audience</TableHead>
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
                    <Badge variant={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.schedule}</TableCell>
                  <TableCell>{campaign.targetAudience}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Sent: {campaign.stats.sent} | Opened: {campaign.stats.opened}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Clicked: {campaign.stats.clicked} | Responded: {campaign.stats.responded}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreviewCampaign(campaign)}>
                        <FontAwesomeIcon icon="eye" className="mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <FontAwesomeIcon icon="edit" className="mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <FontAwesomeIcon icon="chart-line" className="mr-2" />
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
                <h3 className="font-medium">Subject</h3>
                <p className="text-muted-foreground">{selectedCampaign.subject}</p>
              </div>
              <div>
                <h3 className="font-medium">Template</h3>
                <p className="text-muted-foreground">{selectedCampaign.template}</p>
              </div>
              <div>
                <h3 className="font-medium">Schedule</h3>
                <p className="text-muted-foreground">{selectedCampaign.schedule}</p>
              </div>
              <div>
                <h3 className="font-medium">Target Audience</h3>
                <p className="text-muted-foreground">{selectedCampaign.targetAudience}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}