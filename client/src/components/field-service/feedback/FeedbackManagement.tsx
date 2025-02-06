import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { FeedbackFormTemplate, FeedbackRequest } from "@/types/field-service";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  questions: z.array(z.object({
    text: z.string().min(1, "Question text is required"),
    type: z.enum(["rating", "text", "multiple_choice", "checkbox"]),
    required: z.boolean(),
    category: z.enum(["product", "service", "communication", "timeliness", "other"]),
    options: z.array(z.string()).optional(),
    id: z.string().optional(),
    iso9001Category: z.string().optional(),
    validationRules: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
    }).optional(),
  })).min(1, "At least one question is required"),
  version: z.number().optional(),
  isActive: z.boolean().optional(),
  reviewStatus: z.enum(["draft", "under_review", "approved", "archived"]).optional(),
});

const requestFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  templateId: z.string().min(1, "Template is required"),
  deliveryMethod: z.enum(["email", "sms", "portal"]),
});

export function FeedbackManagement() {
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showSendRequest, setShowSendRequest] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FeedbackFormTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      questions: [
        {
          text: "",
          type: "rating",
          required: true,
          category: "service",
          options: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const requestForm = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      templateId: "",
      deliveryMethod: "email",
    },
  });

  const { data: templates = [] } = useQuery<FeedbackFormTemplate[]>({
    queryKey: ['/api/field-service/feedback/templates'],
  });

  const { data: requests = [] } = useQuery<FeedbackRequest[]>({
    queryKey: ['/api/field-service/feedback/requests'],
  });

  const sendRequest = useMutation({
    mutationFn: async (data: Partial<FeedbackRequest>) => {
      const response = await fetch('/api/field-service/feedback/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send feedback request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-service/feedback/requests'] });
      toast({
        title: "Success",
        description: "Feedback request sent successfully",
      });
      setShowSendRequest(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send feedback request",
        variant: "destructive",
      });
    },
  });

  const sendReminder = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/field-service/feedback/requests/${requestId}/remind`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to send reminder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-service/feedback/requests'] });
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: z.infer<typeof templateFormSchema>) => {
      const templateData: Partial<FeedbackFormTemplate> = {
        ...data,
        id: uuidv4(),
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        reviewStatus: 'draft',
        versionHistory: [{
          version: 1,
          modifiedAt: new Date().toISOString(),
          modifiedBy: 'system',
          changes: 'Initial creation'
        }],
        questions: data.questions.map(q => ({
          ...q,
          id: uuidv4(),
          validationRules: q.validationRules || {},
          iso9001Category: q.iso9001Category || q.category,
        })),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      };

      const response = await fetch('/api/field-service/feedback/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-service/feedback/templates'] });
      toast({
        title: "Success",
        description: "Feedback template created successfully",
      });
      setShowNewTemplate(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create feedback template",
        variant: "destructive",
      });
    },
  });

  const metrics = {
    totalRequests: requests.length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    responseRate: requests.length ?
      (requests.filter(r => r.status === 'completed').length / requests.length) * 100 : 0,
    averageResponseTime: requests
      .filter(r => r.completedAt)
      .reduce((acc, r) => {
        const sent = new Date(r.sentAt).getTime();
        const completed = new Date(r.completedAt!).getTime();
        return acc + (completed - sent) / (1000 * 60 * 60); // hours
      }, 0) / requests.filter(r => r.completedAt).length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Feedback Management</h2>
          <p className="text-muted-foreground">
            Create and manage customer feedback forms and requests
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setShowNewTemplate(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Template
          </Button>
          <Button onClick={() => setShowSendRequest(true)}>
            <FontAwesomeIcon icon="paper-plane" className="mr-2 h-4 w-4" />
            Send Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.totalRequests}</p>
              </div>
              <FontAwesomeIcon icon="envelope" className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{metrics.completedRequests}</p>
              </div>
              <FontAwesomeIcon icon="check-circle" className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{metrics.responseRate.toFixed(1)}%</p>
              </div>
              <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(1)}h</p>
              </div>
              <FontAwesomeIcon icon="clock" className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="templates">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="templates">Form Templates</TabsTrigger>
              <TabsTrigger value="requests">Feedback Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>{template.questions.length}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(template.lastModified).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="requests">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Reminders</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.customerName}</TableCell>
                      <TableCell>
                        {templates.find(t => t.id === request.templateId)?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'completed' ? 'default' :
                            request.status === 'expired' ? 'destructive' :
                              'secondary'
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.sentAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(request.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{request.remindersSent}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={request.status !== 'sent' || request.remindersSent >= 3}
                          onClick={() => sendReminder.mutate(request.id)}
                        >
                          <FontAwesomeIcon icon={
                            sendReminder.isPending && sendReminder.variables === request.id
                              ? "spinner"
                              : "bell"
                          } className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Feedback Template</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              try {
                createTemplate.mutate(data);
              } catch (error) {
                console.error('Form submission error:', error);
                toast({
                  title: "Error",
                  description: "Invalid form data. Please check all required fields.",
                  variant: "destructive",
                });
              }
            })} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Customer Service Feedback" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Feedback form for evaluating our customer service" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Questions</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({
                      text: "",
                      type: "rating",
                      required: true,
                      category: "service",
                      options: [],
                    })}
                  >
                    <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      <FontAwesomeIcon icon="times" className="h-4 w-4" />
                    </Button>

                    <FormField
                      control={form.control}
                      name={`questions.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="How would you rate our service?" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`questions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rating">Rating</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`questions.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="timeliness">Timeliness</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`questions.${index}.required`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Required question</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={createTemplate.isPending}>
                {createTemplate.isPending ? (
                  <>
                    <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Template'
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendRequest} onOpenChange={setShowSendRequest}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Feedback Request</DialogTitle>
          </DialogHeader>
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit((data) => {
              sendRequest.mutate(data);
            })} className="space-y-4">
              <FormField
                control={requestForm.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requestForm.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requestForm.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback Template</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requestForm.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="portal">Customer Portal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={sendRequest.isPending}>
                {sendRequest.isPending ? (
                  <>
                    <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon="paper-plane" className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}