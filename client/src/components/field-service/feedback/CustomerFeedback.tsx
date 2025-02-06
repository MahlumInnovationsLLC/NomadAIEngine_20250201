import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CustomerFeedbackItem, ServiceStats } from "@/types/field-service";

export function CustomerFeedback() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'details' | 'actions'>('overview');

  const { data: feedbackItems = [] } = useQuery<CustomerFeedbackItem[]>({
    queryKey: ['/api/field-service/feedback'],
  });

  const { data: stats } = useQuery<ServiceStats>({
    queryKey: ['/api/field-service/stats'],
  });

  // Calculate ISO 9001 metrics
  const metrics = {
    avgResponseTime: feedbackItems.reduce((acc, item) => 
      acc + (item.iso9001?.qualityMetrics.responseTime || 0), 0) / feedbackItems.length || 0,
    avgResolutionTime: feedbackItems.reduce((acc, item) => 
      acc + (item.iso9001?.qualityMetrics.resolutionTime || 0), 0) / feedbackItems.length || 0,
    categoryCounts: feedbackItems.reduce((acc, item) => ({
      ...acc,
      [item.iso9001?.satisfactionCategory || 'other']: (acc[item.iso9001?.satisfactionCategory || 'other'] || 0) + 1
    }), {} as Record<string, number>),
  };

  const categoryTrends = Object.entries(metrics.categoryCounts).map(([category, count]) => ({
    category,
    count,
    percentage: (count / feedbackItems.length) * 100
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Feedback Analysis</h2>
          <p className="text-muted-foreground">ISO 9001 Compliant Feedback Management System</p>
        </div>
        <Button>
          <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats?.feedbackMetrics.averageRating.toFixed(1)}/5</p>
              </div>
              <FontAwesomeIcon icon="star" className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{stats?.feedbackMetrics.responseRate}%</p>
              </div>
              <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(1)}h</p>
              </div>
              <FontAwesomeIcon icon="clock" className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Resolution Time</p>
                <p className="text-2xl font-bold">{metrics.avgResolutionTime.toFixed(1)}h</p>
              </div>
              <FontAwesomeIcon icon="check-circle" className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={selectedView} onValueChange={(value: string) => setSelectedView(value as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview & Trends</TabsTrigger>
              <TabsTrigger value="details">Detailed Feedback</TabsTrigger>
              <TabsTrigger value="actions">Corrective Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{item.iso9001?.satisfactionCategory}</TableCell>
                      <TableCell>{item.rating}/5</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.iso9001?.impactLevel === 'high' ? 'destructive' :
                          item.iso9001?.impactLevel === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {item.iso9001?.impactLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.iso9001?.status === 'new' ? 'default' :
                          item.iso9001?.status === 'under_review' ? 'secondary' :
                          item.iso9001?.status === 'processed' ? 'default' :
                          'outline'
                        }>
                          {item.iso9001?.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.iso9001?.qualityMetrics.responseTime}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="actions">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feedback ID</TableHead>
                    <TableHead>Corrective Action</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effectiveness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackItems.flatMap(item => 
                    (item.iso9001?.correctiveActions || []).map(action => (
                      <TableRow key={action.id}>
                        <TableCell className="font-mono">{item.id}</TableCell>
                        <TableCell>{action.description}</TableCell>
                        <TableCell>{action.assignedTo}</TableCell>
                        <TableCell>{new Date(action.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            action.status === 'open' ? 'secondary' :
                            action.status === 'in_progress' ? 'default' :
                            'outline'
                          }>
                            {action.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{action.effectiveness || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}