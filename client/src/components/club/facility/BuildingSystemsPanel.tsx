import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { BuildingSystem } from "@/types/facility";

interface BuildingSystemsPanelProps {
  systems: BuildingSystem[];
}

export default function BuildingSystemsPanel({ systems }: BuildingSystemsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSystem, setSelectedSystem] = useState<BuildingSystem | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Building Systems</h3>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Add System
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system) => (
          <Card
            key={system.id}
            className="cursor-pointer hover:bg-accent"
            onClick={() => setSelectedSystem(system)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{system.name}</CardTitle>
              <FontAwesomeIcon
                icon={system.type === 'HVAC' ? 'fan' : 'bolt'}
                className={`h-4 w-4 ${getStatusColor(system.status)}`}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={getStatusColor(system.status)}>{system.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{system.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Inspection:</span>
                  <span>{new Date(system.lastInspection).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSystemMutation.mutate({
                        id: system.id,
                        status: system.status === 'operational' ? 'maintenance' : 'operational'
                      });
                    }}
                  >
                    {system.status === 'operational' ? 'Mark Maintenance' : 'Mark Operational'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
