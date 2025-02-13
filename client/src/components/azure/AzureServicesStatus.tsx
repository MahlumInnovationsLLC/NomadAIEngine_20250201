import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ServiceStatus {
  name: string;
  status: "connected" | "disconnected" | "error" | "disabled";
  message?: string;
}

export function AzureServicesStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, error, isLoading, isError, refetch, isFetching } = useQuery<ServiceStatus[]>({
    queryKey: ['/api/azure/status'],
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    // Add a small delay before removing the loading state
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const services = data || [];

  const renderContent = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, index) => (
        <div key={index} className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
          <Skeleton className="h-4 w-[120px]" />
        </div>
      ));
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
          <AlertDescription>
            Failed to load services status. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    return services.map((service) => (
      <div key={service.name} className="flex justify-between items-center py-2">
        <StatusIndicator status={service.status} label={service.name} />
        {(!isFetching && !isRefreshing) ? (
          <span className="text-xs text-muted-foreground">
            {service.message}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon="cloud" className="h-4 w-4 text-muted-foreground animate-pulse" />
            <span className="text-xs text-muted-foreground animate-pulse">
              Checking connection...
            </span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FontAwesomeIcon icon="cloud" className="h-4 w-4" />
          Azure Services Status
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isFetching || isRefreshing}
          className={`h-8 w-8 ${(isFetching || isRefreshing) ? 'animate-spin' : ''}`}
        >
          <FontAwesomeIcon icon="arrows-rotate" className="h-4 w-4" />
          <span className="sr-only">Refresh status</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}