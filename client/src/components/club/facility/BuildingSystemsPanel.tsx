import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
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
import type { BuildingSystem } from "@/types/facility";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import PredictiveMaintenancePanel from "./PredictiveMaintenancePanel";

interface BuildingSystemsPanelProps {
  systems?: BuildingSystem[];
}

const BUILDING_SYSTEMS_QUERY_KEY = '/api/facility/building-systems';

export default function BuildingSystemsPanel({ systems: initialSystems }: BuildingSystemsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSystem, setSelectedSystem] = useState<BuildingSystem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [showPredictions, setShowPredictions] = useState(false);

  // Fetch building systems
  const { data: systems = [], isLoading, error } = useQuery<BuildingSystem[]>({
    queryKey: [BUILDING_SYSTEMS_QUERY_KEY],
    initialData: initialSystems,
    refetchInterval: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  const addSystemMutation = useMutation({
    mutationFn: async (newSystem: Partial<BuildingSystem>) => {
      const response = await fetch(BUILDING_SYSTEMS_QUERY_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSystem),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add system');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUILDING_SYSTEMS_QUERY_KEY] });
      setShowAddDialog(false);
      toast({
        title: 'System Added',
        description: 'New building system has been added successfully.',
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

  const updateSystemMutation = useMutation({
    mutationFn: async (data: { id: number; status: BuildingSystem['status'] }) => {
      const response = await fetch(`${BUILDING_SYSTEMS_QUERY_KEY}/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update system status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUILDING_SYSTEMS_QUERY_KEY] });
      toast({
        title: 'System Updated',
        description: 'Building system status has been updated successfully.',
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

  const handleAddSystem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newSystem = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: 'operational' as const,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string || null,
      healthScore: "100.00",
      metadata: {}
    };

    await addSystemMutation.mutateAsync(newSystem);
  };

  const filteredSystems = systems.filter(system => 
    filterType === "all" ? true : system.type === filterType
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load building systems. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const EmptyState = () => (
    <Card className="w-full p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <FontAwesomeIcon icon="building" className="h-12 w-12 text-muted-foreground opacity-50" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No Building Systems</h3>
          <p className="text-sm text-muted-foreground">
            Get started by adding your first building system to monitor and maintain.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Add First System
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Building Systems</h3>
        {systems.length > 0 && (
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
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse">
              <CardContent className="h-[200px]" />
            </Card>
          ))}
        </div>
      ) : systems.length === 0 ? (
        <EmptyState />
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
                  {system.lastMaintenanceDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Maintenance:</span>
                      <span>{new Date(system.lastMaintenanceDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {system.nextMaintenanceDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Maintenance:</span>
                      <span>{new Date(system.nextMaintenanceDate).toLocaleDateString()}</span>
                    </div>
                  )}
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
              <Select name="type" required>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Additional information about the system"
              />
            </div>

            <Button type="submit" className="w-full">
              Add System
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
    </div>
  );
}