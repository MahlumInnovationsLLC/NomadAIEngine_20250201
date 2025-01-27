import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { BuildingSystem } from "@/types/facility";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PredictiveMaintenancePanel from "./PredictiveMaintenancePanel";

interface BuildingSystemsPanelProps {
  systems?: BuildingSystem[];
}

export default function BuildingSystemsPanel({ systems: initialSystems }: BuildingSystemsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSystem, setSelectedSystem] = useState<BuildingSystem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [showPredictions, setShowPredictions] = useState(false);

  // Fetch building systems using React Query
  const { data: systems = [], isLoading, isError } = useQuery<BuildingSystem[]>({
    queryKey: ['/api/facility/building-systems'],
    initialData: initialSystems,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const addSystemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("Creating new building system with form data:", Object.fromEntries(formData));
      const newSystem = {
        name: formData.get('name') as string,
        type: formData.get('type') as BuildingSystem['type'],
        status: 'operational' as const,
        location: formData.get('location') as string,
        lastInspection: new Date().toISOString(),
        nextInspection: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maintenanceHistory: [],
        installationDate: new Date().toISOString(),
        warranty: {
          provider: "Default Provider",
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          coverage: "Standard warranty"
        },
        specifications: {},
      };

      const response = await fetch('/api/facility/building-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSystem),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add system: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facility/building-systems'] });
      setShowAddDialog(false);
      toast({
        title: 'System Added',
        description: 'New building system has been added successfully.',
      });
    },
    onError: (error: Error) => {
      console.error("Error adding building system:", error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateSystemMutation = useMutation({
    mutationFn: async (data: { id: string; status: BuildingSystem['status'] }) => {
      const response = await fetch(`/api/facility/building-systems/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update system status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facility/building-systems'] });
      toast({
        title: 'System Updated',
        description: 'Building system status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: BuildingSystem['status']) => {
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

  const getSystemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hvac':
        return 'fan';
      case 'electrical':
        return 'bolt';
      case 'plumbing':
        return 'faucet';
      case 'safety':
        return 'shield-halved';
      default:
        return 'cog';
    }
  };

  const handleAddSystem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    addSystemMutation.mutate(formData);
  };

  const filteredSystems = systems.filter(system =>
    filterType === "all" ? true : system.type === filterType
  );

  if (isError) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FontAwesomeIcon icon="exclamation-triangle" className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Systems</h3>
          <p className="text-muted-foreground text-center mb-4">
            Failed to load building systems. Please try again later.
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/facility/building-systems'] })}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Building Systems</CardTitle>
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Systems</SelectItem>
                <SelectItem value="HVAC">HVAC</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddDialog(true)}>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              Add System
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredSystems.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FontAwesomeIcon icon="building" className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Building Systems</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first building system to start monitoring and maintaining your facility.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Add Your First System
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSystems.map((system) => (
              <Card
                key={system.id}
                className="cursor-pointer hover:bg-accent transition-colors"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{system.name}</CardTitle>
                  <FontAwesomeIcon
                    icon={getSystemIcon(system.type)}
                    className={`h-4 w-4 ${getStatusColor(system.status)}`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={getStatusColor(system.status)}>{system.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{system.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{system.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Inspection:</span>
                      <span>{new Date(system.lastInspection).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Inspection:</span>
                      <span>{new Date(system.nextInspection).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant={system.status === 'operational' ? 'outline' : 'default'}
                        className="flex-1"
                        onClick={() => {
                          updateSystemMutation.mutate({
                            id: system.id,
                            status: system.status === 'operational' ? 'maintenance' : 'operational'
                          });
                        }}
                      >
                        {system.status === 'operational' ? 'Mark Maintenance' : 'Mark Operational'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSystem(system);
                          setShowPredictions(true);
                        }}
                      >
                        <FontAwesomeIcon icon="chart-line" className="mr-2 h-4 w-4" />
                        Predict
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add System Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Building System</DialogTitle>
            <DialogDescription>
              Add a new system to monitor and maintain
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSystem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Main HVAC Unit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">System Type</Label>
              <Select name="type" required defaultValue="">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Building Section A"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={addSystemMutation.isPending}
            >
              {addSystemMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
                  Adding...
                </>
              ) : (
                'Add System'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Predictive Maintenance Dialog */}
      <Dialog
        open={showPredictions && selectedSystem !== null}
        onOpenChange={(open) => {
          setShowPredictions(open);
          if (!open) setSelectedSystem(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Predictive Maintenance - {selectedSystem?.name}</DialogTitle>
            <DialogDescription>
              AI-powered maintenance predictions and recommendations
            </DialogDescription>
          </DialogHeader>

          {selectedSystem && (
            <PredictiveMaintenancePanel system={selectedSystem} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}