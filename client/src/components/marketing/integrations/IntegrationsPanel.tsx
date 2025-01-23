import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emailPlatforms = [
  { id: "mailchimp", name: "Mailchimp", icon: "envelope" },
  { id: "sendgrid", name: "SendGrid", icon: "paper-plane" },
  { id: "hubspot", name: "HubSpot", icon: "h" },
  { id: "klaviyo", name: "Klaviyo", icon: "k" },
];

const socialPlatforms = [
  { id: "facebook", name: "Facebook", icon: "facebook" },
  { id: "instagram", name: "Instagram", icon: "instagram" },
  { id: "twitter", name: "Twitter", icon: "twitter" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" },
];

const analyticsPlatforms = [
  { id: "google-analytics", name: "Google Analytics", icon: "chart-line" },
  { id: "mixpanel", name: "Mixpanel", icon: "chart-mixed" },
  { id: "segment", name: "Segment", icon: "chart-network" },
  { id: "amplitude", name: "Amplitude", icon: "wave-square" },
];

type IntegrationConfig = {
  apiKey?: string;
  enabled: boolean;
  syncFrequency: string;
  webhookUrl?: string;
  customFields: Record<string, boolean>;
};

export function IntegrationsPanel() {
  const [integrationConfigs, setIntegrationConfigs] = useState<Record<string, IntegrationConfig>>({});

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

  const renderPlatformCard = (platform: { id: string; name: string; icon: string }, type: string) => {
    const config = integrationConfigs[platform.id] || getDefaultConfig();

    return (
      <Card key={platform.id} className="overflow-hidden">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={[type === 'email' ? 'fal' : 'fab' as IconPrefix, platform.icon as IconName]}
                className="h-5 w-5"
              />
              <CardTitle className="text-lg">{platform.name}</CardTitle>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => handleConfigChange(platform.id, 'enabled', checked)}
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
                {config.enabled
                  ? `Connected to ${platform.name}. Data will sync ${config.syncFrequency}.`
                  : `Configure ${platform.name} integration settings above.`}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Email Marketing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {emailPlatforms.map((platform) => renderPlatformCard(platform, 'email'))}
        </div>
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
