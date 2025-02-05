import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlug, faFileImport, faCog, faSync } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImportStatus {
  contacts: number;
  deals: number;
  companies: number;
  emails: number;
  total: number;
}

export function HubspotIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportStatus>({
    contacts: 0,
    deals: 0,
    companies: 0,
    emails: 0,
    total: 0
  });
  const { toast } = useToast();

  const handleConnect = async () => {
    // This would typically initiate OAuth flow with HubSpot
    toast({
      title: "Connecting to HubSpot",
      description: "Redirecting to HubSpot authorization...",
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    // Simulate import progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(prev => ({
        contacts: Math.min(100, progress),
        deals: Math.max(0, progress - 20),
        companies: Math.max(0, progress - 40),
        emails: Math.max(0, progress - 60),
        total: Math.min(100, progress)
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setIsImporting(false);
        toast({
          title: "Import Complete",
          description: "Successfully imported all HubSpot data",
        });
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPlug} className="text-[#ff7a59]" />
            HubSpot Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Connection Status</h3>
              <p className="text-sm text-muted-foreground">
                {isConnected ? "Connected to HubSpot" : "Not connected"}
              </p>
            </div>
            <Button onClick={handleConnect} variant={isConnected ? "outline" : "default"}>
              <FontAwesomeIcon icon={isConnected ? faCog : faPlug} className="mr-2" />
              {isConnected ? "Configure" : "Connect to HubSpot"}
            </Button>
          </div>

          {isConnected && (
            <>
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Import Data</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Contacts</span>
                      <span className="text-sm">{importProgress.contacts}%</span>
                    </div>
                    <Progress value={importProgress.contacts} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Deals</span>
                      <span className="text-sm">{importProgress.deals}%</span>
                    </div>
                    <Progress value={importProgress.deals} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Companies</span>
                      <span className="text-sm">{importProgress.companies}%</span>
                    </div>
                    <Progress value={importProgress.companies} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Email History</span>
                      <span className="text-sm">{importProgress.emails}%</span>
                    </div>
                    <Progress value={importProgress.emails} />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="flex-1"
                  >
                    <FontAwesomeIcon 
                      icon={isImporting ? faSync : faFileImport} 
                      className={`mr-2 ${isImporting ? 'animate-spin' : ''}`}
                    />
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              </div>

              {importProgress.total > 0 && importProgress.total < 100 && (
                <Alert>
                  <AlertTitle>Import in Progress</AlertTitle>
                  <AlertDescription>
                    Overall Progress: {importProgress.total}%
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}