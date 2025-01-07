import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Cloud } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "connected" | "disconnected" | "error";
  message?: string;
}

export function AzureServicesStatus() {
  const { data: services } = useQuery<ServiceStatus[]>({
    queryKey: ['/api/azure/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          Azure Services Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {services?.map((service) => (
            <div key={service.name} className="flex justify-between items-center">
              <StatusIndicator status={service.status} label={service.name} />
              {service.message && (
                <span className="text-xs text-muted-foreground">
                  {service.message}
                </span>
              )}
            </div>
          ))}
          {!services && (
            <div className="text-sm text-muted-foreground">
              Loading service status...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
