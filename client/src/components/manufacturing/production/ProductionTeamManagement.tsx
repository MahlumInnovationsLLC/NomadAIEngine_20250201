import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Trash2, Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProductionLine } from "@/types/manufacturing";
import { ProductionLineDialog } from "./ProductionLineDialog";
import { ProjectAssignmentDialog } from "./ProjectAssignmentDialog";

export function ProductionTeamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ProductionLine | undefined>(undefined);

  // Query production lines with automatic refresh
  const { data: productionLines = [], isLoading, error, refetch } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/production-lines');
      if (!response.ok) throw new Error('Failed to fetch production lines');
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  // Handle delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/manufacturing/production-lines/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete production line');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Production Line Deleted",
        description: "The production line has been successfully deleted",
      });
      setDeleteDialogOpen(false);
      setSelectedLine(undefined);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete production line",
        variant: "destructive",
      });
    }
  });

  // Handle status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ProductionLine['status'] }) => {
      const response = await fetch(`/api/manufacturing/production-lines/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Failed to update production line status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Status Updated",
        description: "Production line status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Add new production line
  const handleAddLine = () => {
    setSelectedLine(undefined);
    setDialogOpen(true);
  };

  // Edit existing production line
  const handleEditLine = (line: ProductionLine) => {
    setSelectedLine(line);
    setDialogOpen(true);
  };

  // Delete production line
  const handleDeleteLine = (line: ProductionLine) => {
    setSelectedLine(line);
    setDeleteDialogOpen(true);
  };

  // Assign projects to a production line
  const handleAssignProjects = (line: ProductionLine) => {
    setSelectedLine(line);
    setAssignDialogOpen(true);
  };

  // Toggle line status
  const handleToggleStatus = (line: ProductionLine) => {
    const newStatus = line.status === 'operational' ? 'maintenance' : 'operational';
    updateStatusMutation.mutate({ id: line.id, status: newStatus });
  };

  // Organize lines by status for display
  const operationalLines = productionLines.filter(line => line.status === 'operational');
  const maintenanceLines = productionLines.filter(line => line.status === 'maintenance');
  const errorLines = productionLines.filter(line => line.status === 'error' || line.status === 'offline');

  // Get status color
  const getStatusColor = (status: ProductionLine['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500 hover:bg-green-600';
      case 'maintenance':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'offline':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: ProductionLine['status']) => {
    switch (status) {
      case 'operational':
        return 'success' as const;
      case 'maintenance':
        return 'warning' as const;
      case 'error':
        return 'destructive' as const;
      case 'offline':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">Failed to load production lines</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // Render production lines in cards
  const renderProductionLineCard = (line: ProductionLine) => (
    <Card key={line.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{line.name}</CardTitle>
            <CardDescription>
              {line.type ? `${line.type.charAt(0).toUpperCase() + line.type.slice(1)} Line` : 'Production Line'}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(line.status || 'operational')}>
            {line.status ? `${line.status.charAt(0).toUpperCase() + line.status.slice(1)}` : 'Operational'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capacity:</span>
            <span>{line.capacity?.planned || 0} {line.capacity?.unit || 'units/day'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Efficiency:</span>
            <span>{(line.performance?.efficiency || 0) * 100}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assigned Projects:</span>
            <span>{line.assignedProjects?.length || 0}</span>
          </div>
          {line.description && (
            <div className="pt-2 text-xs text-muted-foreground">
              {line.description}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleStatus(line)}
        >
          {(line.status || '') === 'operational' ? 'Set Maintenance' : 'Set Operational'}
        </Button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAssignProjects(line)}
            title="Assign Projects"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditLine(line)}
            title="Edit Line"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteLine(line)}
            title="Delete Line"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Production Team Management</h2>
        <Button onClick={handleAddLine}>
          <Plus className="mr-2 h-4 w-4" />
          Add Production Line
        </Button>
      </div>

      {productionLines.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FontAwesomeIcon icon="industry" className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Production Lines</h3>
            <p className="text-muted-foreground mb-4">
              Add a production line to start managing production capacity
            </p>
            <Button onClick={handleAddLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add Production Line
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All Lines ({productionLines.length})
            </TabsTrigger>
            <TabsTrigger value="operational">
              Operational ({operationalLines.length})
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              Maintenance ({maintenanceLines.length})
            </TabsTrigger>
            <TabsTrigger value="issues">
              Issues ({errorLines.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productionLines.map((line) => renderProductionLineCard(line))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="operational">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operationalLines.map((line) => renderProductionLineCard(line))}
              </div>
              {operationalLines.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No operational production lines found
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="maintenance">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenanceLines.map((line) => renderProductionLineCard(line))}
              </div>
              {maintenanceLines.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No production lines in maintenance
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="issues">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {errorLines.map((line) => renderProductionLineCard(line))}
              </div>
              {errorLines.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No production lines with issues
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

      {/* Add/Edit Production Line Dialog */}
      <ProductionLineDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productionLine={selectedLine}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Production Line</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this production line? This action cannot be undone.</p>
            {selectedLine && <p className="font-medium mt-2">{selectedLine.name}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedLine && deleteMutation.mutate(selectedLine.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Projects to Production Line</DialogTitle>
          </DialogHeader>
          {selectedLine && (
            <ProjectAssignmentDialog 
              lineId={selectedLine.id} 
              lineName={selectedLine.name}
              onClose={() => setAssignDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}