import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Timeline } from "./Timeline";
import { MessageConsistency } from "./MessageConsistency";
import { ChannelSettings } from "./ChannelSettings";

const channels = [
  { id: "email", name: "Email Marketing", icon: "envelope" },
  { id: "social", name: "Social Media", icon: "share-nodes" },
  { id: "push", name: "Push Notifications", icon: "bell" },
  { id: "sms", name: "SMS", icon: "message" },
];

export function ChannelOrchestrator() {
  const [activeChannels, setActiveChannels] = useState<string[]>(["email"]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);

  const toggleChannel = (channelId: string) => {
    setActiveChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Channel Orchestration</h2>
        <Button variant="outline" onClick={() => setShowAIRecommendations(!showAIRecommendations)}>
          <FontAwesomeIcon
            icon={['fal' as IconPrefix, 'brain-circuit' as IconName]}
            className="mr-2 h-4 w-4"
          />
          AI Recommendations
        </Button>
      </div>

      {showAIRecommendations && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p>AI-powered recommendations for your campaign:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Best time to send emails: Tuesday & Thursday mornings</li>
                <li>Recommended social media posting frequency: 3x daily</li>
                <li>Optimal content mix: 70% educational, 30% promotional</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {channels.map(channel => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={['fal' as IconPrefix, channel.icon as IconName]}
                      className="h-4 w-4"
                    />
                    <span>{channel.name}</span>
                  </div>
                  <Switch
                    checked={activeChannels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="consistency">Message Consistency</TabsTrigger>
            <TabsTrigger value="settings">Channel Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <Timeline activeChannels={activeChannels} />
          </TabsContent>

          <TabsContent value="consistency">
            <MessageConsistency activeChannels={activeChannels} />
          </TabsContent>

          <TabsContent value="settings">
            <ChannelSettings activeChannels={activeChannels} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
