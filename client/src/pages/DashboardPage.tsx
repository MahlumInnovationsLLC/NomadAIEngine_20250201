import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  MessageSquare,
  FileText,
  Users,
  ArrowUpRight,
  Clock,
  Calendar,
  HardDrive,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";

interface StorageMetrics {
  totalDocuments: number;
  totalStorageSize: number;
  documentTypes: Record<string, number>;
  aiServiceStatus: boolean;
  storageStatus: boolean;
}

interface ActivityItem {
  type: 'upload' | 'download' | 'delete' | 'view';
  documentName: string;
  timestamp: string;
  userId?: string;
}

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useQuery<StorageMetrics>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentActivity, isLoading: isActivityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/dashboard/activity'],
  });


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and activity monitoring
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Last 7 Days
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Documents
                </p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold mt-2">
                    {stats?.totalDocuments || 0}
                  </h3>
                )}
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Storage Used
                </p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold mt-2">
                    {formatBytes(stats?.totalStorageSize || 0)}
                  </h3>
                )}
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  AI Service Status
                </p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    {stats?.aiServiceStatus ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-lg font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-lg font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Storage Status
                </p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    {stats?.storageStatus ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-lg font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-lg font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <BarChart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Document Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              {isStatsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Object.entries(stats?.documentTypes || {}).map(([type, count]) => ({
                    type,
                    count
                  }))}>
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isActivityLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : (
                recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {activity.type === 'upload' && 'Uploaded'}
                        {activity.type === 'download' && 'Downloaded'}
                        {activity.type === 'delete' && 'Deleted'}
                        {activity.type === 'view' && 'Viewed'}{' '}
                        {activity.documentName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats?.documentTypes || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{type.toUpperCase()} Files</p>
                        <p className="text-sm text-muted-foreground">
                          {count} document{count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}