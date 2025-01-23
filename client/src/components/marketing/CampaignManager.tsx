import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { ContentRecommendations } from "./recommendations/ContentRecommendations";
import { ReportBuilder } from "./reporting/ReportBuilder";
import { AnalyticsDashboard } from "./analytics/AnalyticsDashboard";
import { CustomerSegmentation } from "./analytics/CustomerSegmentation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

// Enhanced schema with audience targeting
const campaignFormSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters"),
  description: z.string(),
  type: z.enum(["email", "social", "multi-channel"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  targetAudience: z.object({
    segments: z.array(z.string()),
    customRules: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.string()
    })).optional(),
    excludedSegments: z.array(z.string()).optional()
  }),
  content: z.string(),
  testingStrategy: z.enum(["none", "ab", "multivariate"]).default("none"),
  testConfig: z.object({
    variables: z.array(z.object({
      name: z.string(),
      variants: z.array(z.string())
    })).optional(),
    targetMetric: z.string().optional(),
    distribution: z.number().min(1).max(100).optional()
  }).optional(),
  socialPlatforms: z.array(z.string()).optional(),
  emailProvider: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const socialPlatforms = [
  { id: "facebook", name: "Facebook", icon: "facebook" as IconName, prefix: "fab" as IconPrefix },
  { id: "instagram", name: "Instagram", icon: "instagram" as IconName, prefix: "fab" as IconPrefix },
  { id: "twitter", name: "Twitter", icon: "twitter" as IconName, prefix: "fab" as IconPrefix },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" as IconName, prefix: "fab" as IconPrefix },
];

const emailProviders = [
  { id: "sendgrid", name: "SendGrid", icon: "envelope" as IconName, prefix: "fal" as IconPrefix },
  { id: "mailchimp", name: "Mailchimp", icon: "envelope-open" as IconName, prefix: "fal" as IconPrefix },
  { id: "hubspot", name: "HubSpot", icon: "envelope-circle-check" as IconName, prefix: "fal" as IconPrefix },
];

const suggestedSegments = [
  { id: "high-value", name: "High-Value Customers", score: 0.95 },
  { id: "churning", name: "At Risk of Churning", score: 0.82 },
  { id: "new-users", name: "New Users (Last 30 Days)", score: 0.78 },
  { id: "inactive", name: "Inactive Users", score: 0.75 },
];

const campaignData = [
  { month: 'Jan', engagement: 4000, conversions: 1000, roi: 25 },
  { month: 'Feb', engagement: 4500, conversions: 1200, roi: 28 },
  { month: 'Mar', engagement: 5000, conversions: 1500, roi: 30 },
  { month: 'Apr', engagement: 5500, conversions: 1800, roi: 33 },
  { month: 'May', engagement: 6000, conversions: 2000, roi: 35 },
];

export function CampaignManager() {
  const [date, setDate] = useState<Date>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [showSegmentSuggestions, setShowSegmentSuggestions] = useState(false);

  // Add state for managing collapsible sections
  const [openSections, setOpenSections] = useState<{
    welcomeEmail: boolean;
    socialMedia: boolean;
    cartRecovery: boolean;
    birthdayRewards: boolean;
  }>({
    welcomeEmail: false,
    socialMedia: false,
    cartRecovery: false,
    birthdayRewards: false,
  });

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      type: "email",
      testingStrategy: "none",
      frequency: "once",
      targetAudience: {
        segments: [],
        customRules: [],
        excludedSegments: []
      }
    },
  });

  function onSubmit(data: CampaignFormValues) {
    console.log(data);
    // TODO: Implement campaign creation API call
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="ai-recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Campaigns
                    </CardTitle>
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, 'bullhorn' as IconName]}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Email Open Rate
                    </CardTitle>
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, 'envelope-open' as IconName]}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24.5%</div>
                    <p className="text-xs text-muted-foreground">
                      +2.1% from last week
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Click-through Rate
                    </CardTitle>
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, 'mouse-pointer' as IconName]}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3.2%</div>
                    <p className="text-xs text-muted-foreground">
                      +0.3% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Conversion Rate
                    </CardTitle>
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, 'chart-line' as IconName]}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.4%</div>
                    <p className="text-xs text-muted-foreground">
                      +0.2% from last month
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Summer Sale 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={['fal' as IconPrefix, 'envelope' as IconName]} />
                                Email Campaign
                              </div>
                            </SelectItem>
                            <SelectItem value="social">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={['fal' as IconPrefix, 'share-nodes' as IconName]} />
                                Social Media
                              </div>
                            </SelectItem>
                            <SelectItem value="multi-channel">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={['fal' as IconPrefix, 'layer-group' as IconName]} />
                                Multi-channel
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Target Audience</FormLabel>
                    <div className="grid gap-4">
                      <Alert>
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>Use AI-powered audience suggestions?</span>
                            <Switch
                              checked={showSegmentSuggestions}
                              onCheckedChange={setShowSegmentSuggestions}
                            />
                          </div>
                        </AlertDescription>
                      </Alert>

                      {showSegmentSuggestions && (
                        <div className="grid gap-2">
                          <p className="text-sm text-muted-foreground">Suggested Segments:</p>
                          {suggestedSegments.map(segment => (
                            <div key={segment.id} className="flex items-center justify-between p-2 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={selectedSegments.includes(segment.id)}
                                  onCheckedChange={() => handleSegmentToggle(segment.id)}
                                />
                                <span>{segment.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(segment.score * 100)}% match
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {form.watch("type") !== "email" && (
                    <div className="space-y-4">
                      <FormLabel>Social Platforms</FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        {socialPlatforms.map(platform => (
                          <div key={platform.id} className="flex items-center space-x-2">
                            <Switch
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={() => handlePlatformToggle(platform.id)}
                            />
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon
                                icon={[platform.prefix, platform.icon]}
                                className="h-4 w-4"
                              />
                              {platform.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(form.watch("type") === "email" || form.watch("type") === "multi-channel") && (
                    <FormField
                      control={form.control}
                      name="emailProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Provider</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select email provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {emailProviders.map(provider => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  <div className="flex items-center gap-2">
                                    <FontAwesomeIcon
                                      icon={[provider.prefix, provider.icon]}
                                      className="h-4 w-4"
                                    />
                                    {provider.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <FontAwesomeIcon
                                  icon={['fal' as IconPrefix, 'calendar' as IconName]}
                                  className="ml-auto h-4 w-4 opacity-50"
                                />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="once">One-time</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="testingStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>A/B Testing</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select testing strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Testing</SelectItem>
                            <SelectItem value="ab">A/B Test</SelectItem>
                            <SelectItem value="multivariate">Multivariate Test</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.value !== "none" && (
                          <Alert>
                            <AlertDescription>
                              A/B testing will automatically split your selected audience segments and track performance metrics for each variant.
                            </AlertDescription>
                          </Alert>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your campaign content..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit">
                      <FontAwesomeIcon
                        icon={['fal' as IconPrefix, 'paper-plane' as IconName]}
                        className="mr-2 h-4 w-4"
                      />
                      Create Campaign
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Channel Campaign Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Active Automations</h3>
                  <div className="grid gap-4">
                    {/* Welcome Email Automation */}
                    <Collapsible
                      open={openSections.welcomeEmail}
                      onOpenChange={(isOpen) =>
                        setOpenSections((prev) => ({ ...prev, welcomeEmail: isOpen }))
                      }
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <FontAwesomeIcon
                            icon={['fal' as IconPrefix, 'envelope' as IconName]}
                            className="h-6 w-6 text-primary"
                          />
                          <div>
                            <h4 className="font-medium">Welcome Series</h4>
                            <p className="text-sm text-muted-foreground">5-step email sequence</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon
                                icon={['fal' as IconPrefix, 'cog' as IconName]}
                                className="h-4 w-4"
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Switch />
                        </div>
                      </div>
                      <CollapsibleContent className="p-4 space-y-4 border-x border-b rounded-b-lg -mt-[1px]">
                        {/* Welcome Email Settings */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Email Provider</Label>
                            <Select defaultValue="sendgrid">
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sendgrid">SendGrid</SelectItem>
                                <SelectItem value="mailchimp">Mailchimp</SelectItem>
                                <SelectItem value="hubspot">HubSpot</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Trigger Delay</Label>
                            <Select defaultValue="immediate">
                              <SelectTrigger>
                                <SelectValue placeholder="Select delay" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediate">Immediate</SelectItem>
                                <SelectItem value="1hour">1 Hour</SelectItem>
                                <SelectItem value="1day">1 Day</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Email Templates</Label>
                          <div className="grid gap-2">
                            {[1, 2, 3, 4, 5].map((step) => (
                              <div key={step} className="flex items-center gap-4 p-2 border rounded">
                                <span className="font-medium">Step {step}</span>
                                <Select defaultValue="template1">
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="template1">Welcome Email</SelectItem>
                                    <SelectItem value="template2">Product Introduction</SelectItem>
                                    <SelectItem value="template3">Case Studies</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  placeholder="Delay (hours)"
                                  className="w-[100px]"
                                  defaultValue={24}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Social Media Automation */}
                    <Collapsible
                      open={openSections.socialMedia}
                      onOpenChange={(isOpen) =>
                        setOpenSections((prev) => ({ ...prev, socialMedia: isOpen }))
                      }
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <FontAwesomeIcon
                            icon={['fal' as IconPrefix, 'share-nodes' as IconName]}
                            className="h-6 w-6 text-primary"
                          />
                          <div>
                            <h4 className="font-medium">Social Media Posts</h4>
                            <p className="text-sm text-muted-foreground">Daily schedule</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon
                                icon={['fal' as IconPrefix, 'cog' as IconName]}
                                className="h-4 w-4"
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Switch />
                        </div>
                      </div>
                      <CollapsibleContent className="p-4 space-y-4 border-x border-b rounded-b-lg -mt-[1px]">
                        {/* Social Media Settings */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Platforms</Label>
                            <div className="space-y-2">
                              {socialPlatforms.map(platform => (
                                <div key={platform.id} className="flex items-center space-x-2">
                                  <Switch
                                    id={platform.id}
                                    checked={selectedPlatforms.includes(platform.id)}
                                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                                  />
                                  <Label htmlFor={platform.id} className="flex items-center gap-2">
                                    <FontAwesomeIcon
                                      icon={[platform.prefix, platform.icon]}
                                      className="h-4 w-4"
                                    />
                                    {platform.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Posting Schedule</Label>
                            <Select defaultValue="daily">
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="custom">Custom Schedule</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Content Settings</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch id="ai-content" />
                              <Label htmlFor="ai-content">Use AI for content generation</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch id="approval-required" />
                              <Label htmlFor="approval-required">Require approval before posting</Label>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    {/* Cart Recovery Trigger */}
                    <Collapsible
                      open={openSections.cartRecovery}
                      onOpenChange={(isOpen) =>
                        setOpenSections((prev) => ({ ...prev, cartRecovery: isOpen }))
                      }
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <FontAwesomeIcon
                            icon={['fal' as IconPrefix, 'cart-shopping' as IconName]}
                            className="h-6 w-6 text-primary"
                          />
                          <div>
                            <h4 className="font-medium">Abandoned Cart Recovery</h4>
                            <p className="text-sm text-muted-foreground">24-hour delay</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon
                                icon={['fal' as IconPrefix, 'cog' as IconName]}
                                className="h-4 w-4"
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Switch />
                        </div>
                      </div>
                      <CollapsibleContent className="p-4 space-y-4 border-x border-b rounded-b-lg -mt-[1px]">
                        {/* Cart Recovery Settings */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Trigger Conditions</Label>
                            <Select defaultValue="cart_abandoned">
                              <SelectTrigger>
                                <SelectValue placeholder="Select trigger" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cart_abandoned">Cart Abandoned</SelectItem>
                                <SelectItem value="checkout_started">Checkout Started</SelectItem>
                                <SelectItem value="payment_failed">Payment Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Wait Duration</Label>
                            <div className="flex gap-2">
                              <Input type="number" defaultValue={24} className="w-20" />
                              <Select defaultValue="hours">
                                <SelectTrigger>
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minutes">Minutes</SelectItem>
                                  <SelectItem value="hours">Hours</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Recovery Actions</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch id="send-email" defaultChecked />
                              <Label htmlFor="send-email">Send recovery email</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch id="offer-discount" />
                              <Label htmlFor="offer-discount">Include discount code</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch id="notify-sales" />
                              <Label htmlFor="notify-sales">Notify sales team</Label>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Birthday Rewards Trigger */}
                    <Collapsible
                      open={openSections.birthdayRewards}
                      onOpenChange={(isOpen) =>
                        setOpenSections((prev) => ({ ...prev, birthdayRewards: isOpen }))
                      }
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <FontAwesomeIcon
                            icon={['fal' as IconPrefix, 'birthday-cake' as IconName]}
                            className="h-6 w-6 text-primary"
                          />
                          <div>
                            <h4 className="font-medium">Birthday Rewards</h4>
                            <p className="text-sm text-muted-foreground">Annual trigger</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon
                                icon={['fal' as IconPrefix, 'cog' as IconName]}
                                className="h-4 w-4"
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Switch />
                        </div>
                      </div>
                      <CollapsibleContent className="p-4 space-y-4 border-x border-b rounded-b-lg -mt-[1px]">
                        {/* Birthday Rewards Settings */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Reward Type</Label>
                            <Select defaultValue="discount">
                              <SelectTrigger>
                                <SelectValue placeholder="Select reward" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="discount">Discount Code</SelectItem>
                                <SelectItem value="points">Loyalty Points</SelectItem>
                                <SelectItem value="gift">Free Gift</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Delivery Timing</Label>
                            <Select defaultValue="on_birthday">
                              <SelectTrigger>
                                <SelectValue placeholder="Select timing" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="on_birthday">On Birthday</SelectItem>
                                <SelectItem value="week_before">Week Before</SelectItem>
                                <SelectItem value="month_before">Month Before</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Communication Channels</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch id="birthday-email" defaultChecked />
                              <Label htmlFor="birthday-email">Email</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch id="birthday-sms" />
                              <Label htmlFor="birthday-sms">SMS</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch id="birthday-notification" />
                              <Label htmlFor="birthday-notification">In-app Notification</Label>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, 'plus' as IconName]}
                      className="mr-2 h-4 w-4"
                    />
                    Create New Automation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <CustomerSegmentation />
        </TabsContent>

        <TabsContent value="ai-recommendations">
          <ContentRecommendations />
        </TabsContent>

        <TabsContent value="custom-reports">
          <ReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}