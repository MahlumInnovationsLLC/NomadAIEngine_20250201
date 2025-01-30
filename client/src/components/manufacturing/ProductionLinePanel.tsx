import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { ProductionMetrics, ProductionLine } from "../../types/manufacturing";
import { AlertCircle } from "lucide-react";

export default function ProductionLinePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productionLine, isLoading, error } = useQuery<ProductionLine>({
    queryKey: ['/api/manufacturing/production-line'],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: ProductionLine['status']) => {
      const response = await fetch('/api/manufacturing/production-line/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-line'] });
      toast({
        title: 'Status Updated',
        description: 'Production line status has been updated successfully.',
      });
    },
  });

  const getStatusColor = (status: ProductionLine['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-500';
      case 'maintenance':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load production line data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Show empty state if no data
  if (!productionLine) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <FontAwesomeIcon icon="industry" className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Production Line Data</h3>
          <p className="text-muted-foreground mb-4">
            Unable to fetch production line information. Please ensure the system is properly configured.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Production Line Status</span>
            <FontAwesomeIcon
              icon="industry"
              className={`h-5 w-5 ${getStatusColor(productionLine.status)}`}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Current Status</span>
              <span className={getStatusColor(productionLine.status)}>
                {productionLine.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Last Maintenance</span>
              <span>
                {productionLine.lastMaintenance
                  ? new Date(productionLine.lastMaintenance).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Next Maintenance</span>
              <span>
                {productionLine.nextMaintenance
                  ? new Date(productionLine.nextMaintenance).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={productionLine.status === 'operational' ? 'outline' : 'default'}
                className="flex-1"
                onClick={() => {
                  updateStatusMutation.mutate(
                    productionLine.status === 'operational' ? 'maintenance' : 'operational'
                  );
                }}
                disabled={updateStatusMutation.isPending}
              >
                {productionLine.status === 'operational' ? 'Start Maintenance' : 'Resume Production'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon="chart-line" className="mr-2 h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>OEE</span>
              <span className="font-semibold">
                {productionLine.performance.oee.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Efficiency</span>
              <span>{productionLine.performance.efficiency.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Quality</span>
              <span>{productionLine.performance.quality.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Availability</span>
              <span>{productionLine.performance.availability.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon="gauge-high" className="mr-2 h-5 w-5" />
            Latest Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productionLine.metrics.slice(-3).map((metric: ProductionMetrics, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span>{metric.type}</span>
                <span>
                  {metric.value} {metric.unit}
                </span>
              </div>
            ))}
            {productionLine.metrics.length === 0 && (
              <div className="text-center text-muted-foreground">
                No metrics recorded yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}