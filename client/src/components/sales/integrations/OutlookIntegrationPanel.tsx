import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { msalInstance } from "@/lib/msal-config";

interface OutlookIntegrationProps {
  onIntegrationUpdate: (status: boolean) => void;
}

export function OutlookIntegrationPanel({ onIntegrationUpdate }: OutlookIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [projectNumberPattern, setProjectNumberPattern] = useState("PRJ-\\d+");
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const response = await msalInstance.loginPopup({
        scopes: [
          "User.Read",
          "Mail.Read",
          "Mail.ReadWrite",
          "Calendars.Read",
          "Calendars.ReadWrite"
        ]
      });

      if (response) {
        setIsConnected(true);
        onIntegrationUpdate(true);
        toast({
          title: "Success",
          description: "Successfully connected to Outlook",
        });
      }
    } catch (error) {
      console.error("Failed to connect to Outlook:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Outlook. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await msalInstance.logoutPopup();
      setIsConnected(false);
      setAutoSyncEnabled(false);
      onIntegrationUpdate(false);
      toast({
        title: "Success",
        description: "Successfully disconnected from Outlook",
      });
    } catch (error) {
      console.error("Failed to disconnect from Outlook:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Outlook. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Microsoft Outlook Integration</CardTitle>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="font-medium">Connection Status</h3>
            <p className="text-sm text-muted-foreground">
              Connect your Outlook account to automatically sync emails and calendar events
            </p>
          </div>
          <Button
            variant={isConnected ? "destructive" : "default"}
            onClick={isConnected ? handleDisconnect : handleConnect}
          >
            <FontAwesomeIcon
              icon={isConnected ? "unlink" : "link"}
              className="mr-2 h-4 w-4"
            />
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>

        {isConnected && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Automatic Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync emails and calendar events containing project numbers
                </p>
              </div>
              <Switch
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Number Pattern</Label>
              <p className="text-sm text-muted-foreground">
                Regular expression pattern to identify project numbers in emails and calendar events
              </p>
              <Input
                value={projectNumberPattern}
                onChange={(e) => setProjectNumberPattern(e.target.value)}
                placeholder="e.g., PRJ-\d+"
              />
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Integration Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                  Automatic email tracking for project discussions
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                  Calendar event synchronization
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                  Deal notes auto-generation
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                  Project number detection and linking
                </li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
