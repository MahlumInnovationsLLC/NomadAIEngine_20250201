import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

export function FeedbackManagement() {
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showSendRequest, setShowSendRequest] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FeedbackFormTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery<FeedbackFormTemplate[]>({
    queryKey: ['/api/field-service/feedback/templates'],
  });

  // Fetch feedback requests
  const { data: requests = [] } = useQuery<FeedbackRequest[]>({
    queryKey: ['/api/field-service/feedback/requests'],
  });

  // Send feedback request mutation
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

  // Calculate metrics
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

      {/* Metrics */}
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

      {/* Main Content */}
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
                          disabled={request.status !== 'sent'}
                          onClick={() => {
                            // Send reminder logic
                          }}
                        >
                          <FontAwesomeIcon icon="bell" className="h-4 w-4" />
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

      {/* Template Dialog would go here */}
      {/* Send Request Dialog would go here */}
    </div>
  );
}
