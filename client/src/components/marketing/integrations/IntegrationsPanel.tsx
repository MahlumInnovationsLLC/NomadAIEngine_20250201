import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  faCircleCheck,
  faCircleXmark,
  faTriangleExclamation,
  faArrowsRotate,
  faEnvelope,
  faPaperPlane,
  faSquareH,
  faChartLine,
  faChartBar,
  faSitemap,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const emailPlatforms = [
  { id: "mailchimp", name: "Mailchimp", icon: faEnvelope },
  { id: "sendgrid", name: "SendGrid", icon: faPaperPlane },
  { id: "hubspot", name: "HubSpot", icon: faSquareH },
  { id: "klaviyo", name: "Klaviyo", icon: faSquareH }, // Using faSquareH as fallback
];

const socialPlatforms = [
  { id: "facebook", name: "Facebook", icon: faFacebook },
  { id: "instagram", name: "Instagram", icon: faInstagram },
  { id: "twitter", name: "Twitter", icon: faTwitter },
  { id: "linkedin", name: "LinkedIn", icon: faLinkedin },
];

const analyticsPlatforms = [
  { id: "google-analytics", name: "Google Analytics", icon: faChartLine },
  { id: "mixpanel", name: "Mixpanel", icon: faChartBar },
  { id: "segment", name: "Segment", icon: faSitemap },
  { id: "amplitude", name: "Amplitude", icon: faChartSimple },
];

interface IntegrationConfig {
  apiKey?: string;
  enabled: boolean;
  syncFrequency: string;
  webhookUrl?: string;
  customFields: Record<string, boolean>;
}

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: string;
  message?: string;
}

interface IntegrationConfigs {
  [key: string]: IntegrationConfig;
}

function ConnectionStatusIndicator({ status, isRefreshing, onRefresh }: {
  status: ConnectionStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const statusColors = {
    connected: 'text-green-500',
    disconnected: 'text-gray-500',
    error: 'text-red-500'
  };

  const statusIcons = {
    connected: faCircleCheck,
    disconnected: faCircleXmark,
    error: faTriangleExclamation
  };

  return (
    <div className="flex items-center gap-2">
      <FontAwesomeIcon
        icon={statusIcons[status.status]}
        className={`h-4 w-4 ${statusColors[status.status]}`}
      />
      <span className={cn(
        "text-sm transition-opacity duration-1000",
        isRefreshing && "animate-pulse opacity-50"
      )}>
        {isRefreshing ? "Checking connection..." : status.message || status.status}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className={cn(
          "ml-2 p-1 h-8 w-8 rounded-full hover:bg-muted",
          isRefreshing && "animate-spin"
        )}
      >
        <FontAwesomeIcon
          icon={faArrowsRotate}
          className={cn("h-4 w-4", isRefreshing && "animate-spin")}
        />
        <span className="sr-only">Refresh connection status</span>
      </Button>
    </div>
  );
}

export function IntegrationsPanel() {
  const { toast } = useToast();
  const [integrationConfigs, setIntegrationConfigs] = useState<IntegrationConfigs>({});
  const [refreshingIntegrations, setRefreshingIntegrations] = useState<Set<string>>(new Set());

  // Fetch saved configurations
  const { data: savedConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['/api/integrations/configs'] as const
  });

  // Update local state when saved configs are loaded
  useEffect(() => {
    if (savedConfigs) {
      setIntegrationConfigs(savedConfigs);
    }
  }, [savedConfigs]);

  // Fetch integration statuses
  const { data: connectionStatuses, refetch: refreshStatuses } = useQuery({
    queryKey: ['/api/integrations/status'] as const,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutation for refreshing individual integration status
  const refreshIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      setRefreshingIntegrations(prev => new Set([...prev, integrationId]));
      try {
        const response = await fetch(`/api/integrations/${integrationId}/refresh`, {
          method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to refresh integration status');
        return response.json();
      } finally {
        setRefreshingIntegrations(prev => {
          const next = new Set(prev);
          next.delete(integrationId);
          return next;
        });
      }
    },
    onSuccess: () => {
      refreshStatuses();
    },
  });

  // Mutation for saving integration configuration
  const saveConfig = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: IntegrationConfig }) => {
      const response = await fetch(`/api/integrations/${id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Configuration Saved",
        description: `Successfully saved configuration for ${variables.id}`,
      });
      refreshIntegration.mutate(variables.id);
    },
    onError: (error) => {
      toast({
        title: "Error Saving Configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDefaultConfig = (): IntegrationConfig => ({
    enabled: false,
    syncFrequency: "daily",
    customFields: {},
  });

  const handleConfigChange = (platformId: string, field: keyof IntegrationConfig, value: any) => {
    setIntegrationConfigs(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId] || getDefaultConfig(),
        [field]: value,
      },
    }));
  };

  const handleSaveConfig = (platformId: string) => {
    const config = integrationConfigs[platform.id];
    if (!config) return;
    saveConfig.mutate({ id: platformId, config });
  };

  const handleRefreshAll = async () => {
    const allPlatforms = [...emailPlatforms, ...socialPlatforms, ...analyticsPlatforms];
    for (const platform of allPlatforms) {
      if (integrationConfigs[platform.id]?.enabled) {
        await refreshIntegration.mutateAsync(platform.id);
      }
    }
  };

  const renderPlatformCard = (platform: { id: string; name: string; icon: any }, type: string) => {
    const config = integrationConfigs[platform.id] || getDefaultConfig();
    const connectionStatus = (connectionStatuses as Record<string, ConnectionStatus> | undefined)?.[platform.id] || {
      status: 'disconnected' as const,
      lastChecked: new Date().toISOString(),
      message: config.apiKey ? 'Checking connection...' : 'Not configured'
    };
    const isRefreshing = refreshingIntegrations.has(platform.id);

    return (
      <Card key={platform.id} className="overflow-hidden">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={platform.icon}
                  className="h-5 w-5"
                />
                <CardTitle className="text-lg">{platform.name}</CardTitle>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => handleConfigChange(platform.id, 'enabled', checked)}
              />
            </div>
            <ConnectionStatusIndicator
              status={connectionStatus}
              isRefreshing={isRefreshing}
              onRefresh={() => refreshIntegration.mutate(platform.id)}
            />
          </div>
        </CardHeader>

        {config.enabled && (
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange(platform.id, 'apiKey', e.target.value)}
                placeholder={`Enter ${platform.name} API Key`}
              />
            </div>

            <div className="space-y-2">
              <Label>Sync Frequency</Label>
              <Select
                value={config.syncFrequency}
                onValueChange={(value) => handleConfigChange(platform.id, 'syncFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'email' && (
              <div className="space-y-2">
                <Label>Custom Fields Sync</Label>
                <div className="space-y-2">
                  {['First Name', 'Last Name', 'Phone', 'Tags', 'Custom Properties'].map((field) => (
                    <div key={field} className="flex items-center gap-2">
                      <Switch
                        id={`${platform.id}-${field}`}
                        checked={config.customFields?.[field] || false}
                        onCheckedChange={(checked) =>
                          handleConfigChange(platform.id, 'customFields', {
                            ...config.customFields,
                            [field]: checked,
                          })
                        }
                      />
                      <Label htmlFor={`${platform.id}-${field}`}>{field}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === 'analytics' && (
              <div className="space-y-2">
                <Label>Tracking Options</Label>
                <div className="space-y-2">
                  {['Page Views', 'Events', 'Conversions', 'User Properties'].map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <Switch
                        id={`${platform.id}-${option}`}
                        checked={config.customFields?.[option] || false}
                        onCheckedChange={(checked) =>
                          handleConfigChange(platform.id, 'customFields', {
                            ...config.customFields,
                            [option]: checked,
                          })
                        }
                      />
                      <Label htmlFor={`${platform.id}-${option}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Webhook URL (Optional)</Label>
              <Input
                value={config.webhookUrl || ''}
                onChange={(e) => handleConfigChange(platform.id, 'webhookUrl', e.target.value)}
                placeholder="https://your-webhook-url.com"
              />
            </div>

            <Alert>
              <AlertDescription>
                {connectionStatus.status === 'connected'
                  ? `Connected to ${platform.name}. Last synced: ${new Date(connectionStatus.lastChecked).toLocaleString()}`
                  : connectionStatus.message || `Configure ${platform.name} integration settings above.`}
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              onClick={() => handleSaveConfig(platform.id)}
              disabled={saveConfig.isPending}
            >
              {saveConfig.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Email Marketing</h2>
        <Button
          variant="outline"
          onClick={handleRefreshAll}
          disabled={refreshIntegration.isPending}
          className="gap-2"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            className={cn("h-4 w-4", refreshIntegration.isPending && "animate-spin")}
          />
          Refresh All
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {emailPlatforms.map((platform) => renderPlatformCard(platform, 'email'))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Social Media</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {socialPlatforms.map((platform) => renderPlatformCard(platform, 'social'))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Analytics Tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {analyticsPlatforms.map((platform) => renderPlatformCard(platform, 'analytics'))}
        </div>
      </div>
    </div>
  );
}