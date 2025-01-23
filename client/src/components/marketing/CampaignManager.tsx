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
import { AnalyticsDashboard } from "./analytics/AnalyticsDashboard";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

const campaignFormSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters"),
  description: z.string(),
  type: z.enum(["email", "social", "multi-channel"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  targetAudience: z.string(),
  content: z.string(),
  testingStrategy: z.enum(["none", "ab", "multivariate"]).default("none"),
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

export function CampaignManager() {
  const [date, setDate] = useState<Date>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      type: "email",
      testingStrategy: "none",
      frequency: "once",
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

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
                              A/B testing will automatically split your audience and track performance metrics for each variant.
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
              <CardTitle>Campaign Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Configure automated workflows for your campaigns
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}