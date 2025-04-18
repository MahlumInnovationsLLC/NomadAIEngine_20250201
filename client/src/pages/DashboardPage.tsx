import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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

interface ExtendedStats {
  collaborators: number;
  chatActivity: {
    totalResponses: number;
    downloadedReports: number;
  };
  trainingLevel: {
    level: string;
    progress: number;
  };
  incompleteTasks: number;
  aiEngineUsage: Array<{
    date: string;
    minutes: number;
  }>;
}

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useQuery<StorageMetrics>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentActivity, isLoading: isActivityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/dashboard/activity'],
  });

  const { data: extendedStats, isLoading: isExtendedStatsLoading } = useQuery<ExtendedStats>({
    queryKey: ['/api/dashboard/extended-stats'],
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
          <FontAwesomeIcon icon="calendar" className="h-4 w-4" />
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
              <FontAwesomeIcon icon="file-lines" className="h-8 w-8 text-muted-foreground" />
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
              <FontAwesomeIcon icon="hard-drive" className="h-8 w-8 text-muted-foreground" />
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
                        <FontAwesomeIcon icon="circle-check" className="h-5 w-5 text-green-500" />
                        <span className="text-lg font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon="circle-xmark" className="h-5 w-5 text-red-500" />
                        <span className="text-lg font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <FontAwesomeIcon icon="message" className="h-8 w-8 text-muted-foreground" />
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
                        <FontAwesomeIcon icon="circle-check" className="h-5 w-5 text-green-500" />
                        <span className="text-lg font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon="circle-xmark" className="h-5 w-5 text-red-500" />
                        <span className="text-lg font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <FontAwesomeIcon icon="chart-mixed" className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Collaborators
                </p>
                {isExtendedStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold mt-2">
                    {extendedStats?.collaborators || 0}
                  </h3>
                )}
              </div>
              <FontAwesomeIcon icon="users" className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Chat Activity
                </p>
                {isExtendedStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <div>
                    <h3 className="text-2xl font-bold mt-2">
                      {(extendedStats?.chatActivity.totalResponses || 0) +
                        (extendedStats?.chatActivity.downloadedReports || 0)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {extendedStats?.chatActivity.downloadedReports || 0} reports
                    </p>
                  </div>
                )}
              </div>
              <FontAwesomeIcon icon="message" className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Training Level
                </p>
                {isExtendedStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <div>
                    <h3 className="text-2xl font-bold mt-2">
                      {extendedStats?.trainingLevel.level || 'Beginner'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {extendedStats?.trainingLevel.progress || 0}% complete
                    </p>
                  </div>
                )}
              </div>
              <FontAwesomeIcon icon="graduation-cap" className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Incomplete Tasks
                </p>
                {isExtendedStatsLoading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold mt-2">
                    {extendedStats?.incompleteTasks || 0}
                  </h3>
                )}
              </div>
              <FontAwesomeIcon icon="clipboard-list" className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">AI Engine Activity</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              Past 7 days
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              {isExtendedStatsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : extendedStats?.aiEngineUsage && extendedStats.aiEngineUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={extendedStats.aiEngineUsage} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      label={{ 
                        value: 'Minutes Used',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: 'hsl(var(--muted-foreground))' }
                      }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number) => [`${value.toFixed(1)} minutes`, 'Usage Time']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorUsage)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No activity data available</p>
                </div>
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
                    <FontAwesomeIcon icon="clock" className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </div>
  );
}