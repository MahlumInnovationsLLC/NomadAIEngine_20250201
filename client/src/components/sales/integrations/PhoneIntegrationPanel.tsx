import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";

interface PhoneIntegrationProps {
  onIntegrationUpdate: (status: boolean) => void;
}

export function PhoneIntegrationPanel({ onIntegrationUpdate }: PhoneIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(false);
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      // Here we would integrate with a phone system API
      setIsConnected(true);
      onIntegrationUpdate(true);
      toast({
        title: "Success",
        description: "Successfully connected phone integration",
      });
    } catch (error) {
      console.error("Failed to connect phone integration:", error);
      toast({
        title: "Error",
        description: "Failed to connect phone integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsConnected(false);
      setAutoRecordEnabled(false);
      setTranscriptionEnabled(false);
      onIntegrationUpdate(false);
      toast({
        title: "Success",
        description: "Successfully disconnected phone integration",
      });
    } catch (error) {
      console.error("Failed to disconnect phone integration:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect phone integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Phone System Integration</CardTitle>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Phone Number</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isConnected}
              />
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
          </div>

          {isConnected && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Automatic Call Recording</Label>
                  <p className="text-sm text-muted-foreground">
                    Record calls automatically when project numbers are mentioned
                  </p>
                </div>
                <Switch
                  checked={autoRecordEnabled}
                  onCheckedChange={setAutoRecordEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Call Transcription</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate transcripts and automatically detect project references
                  </p>
                </div>
                <Switch
                  checked={transcriptionEnabled}
                  onCheckedChange={setTranscriptionEnabled}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium">Integration Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                    Automatic call recording
                  </li>
                  <li className="flex items-center">
                    <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                    Real-time transcription
                  </li>
                  <li className="flex items-center">
                    <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                    Project number detection
                  </li>
                  <li className="flex items-center">
                    <FontAwesomeIcon icon="check" className="text-green-500 mr-2" />
                    Deal notes auto-generation
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
