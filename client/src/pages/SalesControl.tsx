import { Suspense } from "react";
import { SalesControlDashboard } from "@/components/sales/SalesControlDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

interface SalesStats {
  totalRevenue: number;
  activeDeals: number;
  conversionRate: number;
  salesTarget: number;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function SalesControl() {
  const { data: stats } = useQuery<SalesStats>({
    queryKey: ['/api/sales/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="text-center py-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-3xl font-bold mb-4">Sales Control</h1>
          <p className="text-muted-foreground mb-4">
            Manage sales pipelines, analytics, and customer relationships
          </p>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <h3 className="text-2xl font-bold">${stats?.totalRevenue?.toLocaleString() || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="dollar-sign" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                    <h3 className="text-2xl font-bold">{stats?.activeDeals || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="handshake" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <h3 className="text-2xl font-bold">{stats?.conversionRate || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sales Target</p>
                    <h3 className="text-2xl font-bold">{stats?.salesTarget || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="bullseye" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <SalesControlDashboard />
        </Suspense>
      </div>
    </AnimateTransition>
  );
}