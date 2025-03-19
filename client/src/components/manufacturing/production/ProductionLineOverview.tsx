import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PlusCircle, 
  BarChart, 
  Settings, 
  AlertCircle, 
  Edit, 
  Trash2, 
  ClipboardCheck,
  Activity,
  AlertTriangle,
  PowerOff,
  Wrench
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ProductionLineDialog } from "./ProductionLineDialog";
import { ProjectAssignmentDialog } from "./ProjectAssignmentDialog";
import { ProductionTeamManagement } from "./ProductionTeamManagement";
import { ProductionLine } from "../../../types/manufacturing";

export function ProductionLineOverview() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production lines data
  const { data: productionLines = [], isLoading, error } = useQuery<ProductionLine[]>({
    queryKey: ['/api/manufacturing/production-lines'],
    refetchInterval: 5000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/manufacturing/production-lines/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Production line not found');
        }
        throw new Error('Failed to delete production line');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: 'Success',
        description: 'Production line deleted successfully',
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete production line',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductionLine['status'] }) => {
      const response = await fetch(`/api/manufacturing/production-lines/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update production line status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: 'Success',
        description: 'Production line status updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update production line status',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'offline':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Activity className="h-4 w-4 mr-2" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 mr-2" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 mr-2" />;
      case 'offline':
        return <PowerOff className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  // Handle edit button click
  const handleEdit = (line: ProductionLine) => {
    setSelectedLine(line);
    setDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (line: ProductionLine) => {
    setSelectedLine(line);
    setDeleteDialogOpen(true);
  };

  // Handle assign projects button click
  const handleAssignProjects = (line: ProductionLine) => {
    setSelectedLine(line);
    setAssignDialogOpen(true);
  };

  // Handle status change
  const handleStatusChange = (line: ProductionLine, status: ProductionLine['status']) => {
    updateStatusMutation.mutate({ id: line.id, status });
  };

  // Calculate summary metrics
  const totalLines = productionLines.length;
  const operationalLines = productionLines.filter(line => line.status === 'operational').length;
  const averageOEE = productionLines.length > 0 
    ? productionLines.reduce((sum, line) => sum + line.performance.oee, 0) / productionLines.length
    : 0;
  const averageQuality = productionLines.length > 0 
    ? productionLines.reduce((sum, line) => sum + line.performance.quality, 0) / productionLines.length
    : 0;

  // If we're loading, show a loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // If there's an error, show an error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Production Lines</h3>
            <p className="text-muted-foreground">
              Unable to load production line data. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Production Line Management</h2>
        <Button onClick={() => { setSelectedLine(null); setDialogOpen(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Production Line
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Active Lines</div>
            <div className="text-2xl font-bold">{operationalLines}/{totalLines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Average OEE</div>
            <div className="text-2xl font-bold">{(averageOEE * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Quality Rate</div>
            <div className="text-2xl font-bold">{(averageQuality * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 pt-6">
            <div className="text-sm text-muted-foreground">Production Capacity</div>
            <div className="text-2xl font-bold">
              {productionLines.reduce((sum, line) => sum + line.capacity.actual, 0)} / 
              {productionLines.reduce((sum, line) => sum + line.capacity.planned, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Production Lines</CardTitle>
              <CardDescription>
                Overview of all production lines and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productionLines.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Production Lines Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first production line
                  </p>
                  <Button onClick={() => { setSelectedLine(null); setDialogOpen(true); }}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Production Line
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {productionLines.map((line) => (
                    <Card key={line.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{line.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {line.description || `${line.type} line`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(line.status)}
                            >
                              {line.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(line)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAssignProjects(line)}>
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  Assign Projects
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(line, 'operational')}
                                  disabled={line.status === 'operational'}
                                >
                                  <Activity className="h-4 w-4 mr-2" />
                                  Set Operational
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(line, 'maintenance')}
                                  disabled={line.status === 'maintenance'}
                                >
                                  <Wrench className="h-4 w-4 mr-2" />
                                  Set Maintenance
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(line, 'error')}
                                  disabled={line.status === 'error'}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Set Error
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(line, 'offline')}
                                  disabled={line.status === 'offline'}
                                >
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Set Offline
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(line)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>OEE</span>
                              <span className="font-medium">{(line.performance.oee * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={line.performance.oee * 100} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Efficiency</span>
                              <div className="font-medium">{(line.performance.efficiency * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quality</span>
                              <div className="font-medium">{(line.performance.quality * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Availability</span>
                              <div className="font-medium">{(line.performance.availability * 100).toFixed(1)}%</div>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">
                              {line.capacity.actual} / {line.capacity.planned} {line.capacity.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                      <CardFooter className="bg-muted/50 p-3 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAssignProjects(line)}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          {line.assignedProjects && line.assignedProjects.length 
                            ? `${line.assignedProjects.length} Projects Assigned` 
                            : "Assign Projects"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for all production lines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed charts and analytics for production line performance will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Production Schedules</CardTitle>
              <CardDescription>
                View and manage production line schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scheduling Coming Soon</h3>
                <p className="text-muted-foreground">
                  Production scheduling and planning features will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Production Team Management</CardTitle>
              <CardDescription>
                Manage team leads and team members for each production line
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionTeamManagement productionLines={productionLines} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Production Line Dialog */}
      <ProductionLineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productionLine={selectedLine || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Production Line</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this production line? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-muted/50 p-4 rounded-md">
            <h4 className="font-medium text-lg">{selectedLine?.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedLine?.description || `${selectedLine?.type} line`}
            </p>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLine && deleteMutation.mutate(selectedLine.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Deleting...
                </>
              ) : (
                "Delete Production Line"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Assignment Dialog - We'll create this component next */}
      {selectedLine && (
        <ProjectAssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          productionLine={selectedLine}
        />
      )}
    </div>
  );
}