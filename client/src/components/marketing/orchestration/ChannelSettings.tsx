import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

interface ChannelSettingsProps {
  activeChannels: string[];
}

type ChannelSetting = {
  channel: string;
  frequency: string;
  timeZone: string;
  autoOptimize: boolean;
  customSettings: Record<string, any>;
};

const mockSettings: ChannelSetting[] = [
  {
    channel: "email",
    frequency: "daily",
    timeZone: "America/New_York",
    autoOptimize: true,
    customSettings: {
      sender: "marketing@company.com",
      replyTo: "support@company.com"
    }
  },
  {
    channel: "social",
    frequency: "3x_daily",
    timeZone: "America/New_York",
    autoOptimize: true,
    customSettings: {
      platforms: ["facebook", "instagram", "twitter"]
    }
  },
  {
    channel: "push",
    frequency: "weekly",
    timeZone: "America/New_York",
    autoOptimize: false,
    customSettings: {
      maxLength: 140
    }
  }
];

export function ChannelSettings({ activeChannels }: ChannelSettingsProps) {
  return (
    <div className="space-y-6">
      {mockSettings
        .filter(setting => activeChannels.includes(setting.channel))
        .map(setting => (
          <Card key={setting.channel}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={['fal' as IconPrefix,
                      setting.channel === "email" ? "envelope" :
                      setting.channel === "social" ? "share-nodes" :
                      "bell" as IconName
                    ]}
                    className="h-4 w-4"
                  />
                  {setting.channel.charAt(0).toUpperCase() + setting.channel.slice(1)} Settings
                </CardTitle>
                <Button variant="outline" size="sm">
                  <FontAwesomeIcon
                    icon={['fal' as IconPrefix, 'rotate' as IconName]}
                    className="mr-2 h-4 w-4"
                  />
                  Reset Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Posting Frequency</Label>
                  <Select defaultValue={setting.frequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="3x_daily">3x Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select defaultValue={setting.timeZone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label>AI Optimization</Label>
                  <div className="text-sm text-muted-foreground">
                    Let AI optimize delivery times and content
                  </div>
                </div>
                <Switch checked={setting.autoOptimize} />
              </div>

              {/* Channel-specific settings */}
              {setting.channel === "email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sender Email</Label>
                    <Input defaultValue={setting.customSettings.sender} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reply-To Email</Label>
                    <Input defaultValue={setting.customSettings.replyTo} />
                  </div>
                </div>
              )}

              {setting.channel === "social" && (
                <div className="space-y-4">
                  <Label>Connected Platforms</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {setting.customSettings.platforms.map((platform: string) => (
                      <div key={platform} className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="capitalize">{platform}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {setting.channel === "push" && (
                <div className="space-y-2">
                  <Label>Maximum Notification Length</Label>
                  <Input
                    type="number"
                    defaultValue={setting.customSettings.maxLength}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
