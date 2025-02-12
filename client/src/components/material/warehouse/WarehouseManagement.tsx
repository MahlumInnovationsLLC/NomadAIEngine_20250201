import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { Warehouse, WarehouseZone, WarehouseMetrics } from "@/types/material";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ZoneUtilizationDialog } from "./ZoneUtilizationDialog";
import { ZoneCreateDialog } from "./ZoneCreateDialog";
import WarehouseEdit from "../../warehouse/WarehouseEdit";
import { BulkImportDialog } from "./BulkImportDialog";

interface WarehouseManagementProps {
  selectedWarehouse: string | null;
  onWarehouseSelect: (warehouseId: string) => void;
}

export function WarehouseManagement({
  selectedWarehouse,
  onWarehouseSelect
}: WarehouseManagementProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editWarehouse, setEditWarehouse] = useState<string | null>(null);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: warehouses = [],
    isLoading: isLoadingWarehouses,
    error: warehousesError,
    refetch: refetchWarehouses
  } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouse'],
    retry: 3,
    onError: (error: Error) => {
      console.error('Failed to fetch warehouses:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouses. Please try again.",
        variant: "destructive",
      });
    }
  } as UseQueryOptions<Warehouse[]>);

  const { data: metrics } = useQuery<WarehouseMetrics>({
    queryKey: ['/api/warehouse/metrics', selectedWarehouse],
    enabled: !!selectedWarehouse,
    retry: 3,
  });

  const {
    data: zones = [],
    isLoading: zonesLoading
  } = useQuery<WarehouseZone[]>({
    queryKey: ['/api/warehouse/zones', selectedWarehouse],
    enabled: !!selectedWarehouse,
    retry: 3,
  });

  const updateZoneMutation = useMutation({
    mutationFn: async ({ zoneId, updates }: { zoneId: string; updates: Partial<WarehouseZone> }) => {
      const response = await fetch(`/api/warehouse/zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update zone');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', selectedWarehouse] });
      toast({
        title: "Zone Updated",
        description: "The zone has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Update zone error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update zone. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (zoneData: Partial<WarehouseZone>) => {
      const response = await fetch('/api/warehouse/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create zone');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', selectedWarehouse] });
      setShowAddZone(false);
      toast({
        title: "Zone Created",
        description: "New warehouse zone has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Create zone error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create zone. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ warehouseId, updates }: { warehouseId: string, updates: Partial<Warehouse> }) => {
      const response = await fetch(`/api/warehouse/${warehouseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update warehouse');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/warehouse'], (oldData: Warehouse[] | undefined) => {
        if (!oldData) return [data];
        return oldData.map(warehouse =>
          warehouse.id === data.id ? data : warehouse
        );
      });
      toast({
        title: "Warehouse Updated",
        description: "Warehouse details have been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Update warehouse error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update warehouse",
        variant: "destructive",
      });
    },
  });

  const selectedWarehouseData = warehouses.find(w => w.id === selectedWarehouse) || null;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  const renderWarehouseCard = (warehouse: Warehouse) => (
    <Card
      key={warehouse.id}
      className={`cursor-pointer transition-all ${
        selectedWarehouse === warehouse.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onWarehouseSelect(warehouse.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{warehouse.name}</h3>
          <div className="flex items-center gap-2">
            <Badge>{warehouse.type}</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setEditWarehouse(warehouse.id);
              }}
            >
              <FontAwesomeIcon icon="edit" className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Location: {warehouse.location || 'N/A'}</p>
          <p>Capacity: {warehouse.capacity?.total?.toLocaleString() || '0'} sq ft</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-grow bg-secondary h-2 rounded-full">
              <div
                className={`h-full rounded-full ${
                  getUtilizationColor(warehouse.utilizationPercentage || 0)
                }`}
                style={{ width: `${warehouse.utilizationPercentage || 0}%` }}
              />
            </div>
            <span className={getUtilizationColor(warehouse.utilizationPercentage || 0)}>
              {warehouse.utilizationPercentage || 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingWarehouses) {
    return (
      <div className="flex items-center justify-center h-96">
        <FontAwesomeIcon icon="spinner" className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (warehousesError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <FontAwesomeIcon icon="exclamation-triangle" className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium">Failed to load warehouses</p>
        <p className="text-sm text-muted-foreground">
          {warehousesError instanceof Error ? warehousesError.message : "Unknown error occurred"}
        </p>
        <Button onClick={() => refetchWarehouses()}>
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Material Handling & Supply Chain</h2>
          <p className="text-muted-foreground">
            Comprehensive inventory management and supply chain optimization system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkImport(true)}
          >
            <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditWarehouse('new')}
          >
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex space-x-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-4",
            activeTab === "inventory" && "bg-muted"
          )}
          onClick={() => setActiveTab("inventory")}
        >
          <FontAwesomeIcon icon="box" className="mr-2 h-4 w-4" />
          Inventory
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-4",
            activeTab === "supply-chain" && "bg-muted"
          )}
          onClick={() => setActiveTab("supply-chain")}
        >
          <FontAwesomeIcon icon="truck" className="mr-2 h-4 w-4" />
          Supply Chain
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map(renderWarehouseCard)}
      </div>

      <WarehouseEdit
        warehouse={editWarehouse === 'new' ? undefined : warehouses.find(w => w.id === editWarehouse)}
        isOpen={!!editWarehouse}
        onClose={() => setEditWarehouse(null)}
        onUpdate={(warehouseId: string, updates: Partial<Warehouse>) => {
          updateWarehouseMutation.mutate({ warehouseId, updates });
        }}
      />

      {selectedWarehouseData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedWarehouseData.name} Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="zones">Zones & Locations</TabsTrigger>
                <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Space</p>
                          <h3 className="text-2xl font-bold">
                            {selectedWarehouseData.capacity?.total?.toLocaleString() || '0'} sq ft
                          </h3>
                        </div>
                        <FontAwesomeIcon icon="warehouse" className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Used Space</p>
                          <h3 className="text-2xl font-bold">
                            {selectedWarehouseData.capacity?.used?.toLocaleString() || '0'} sq ft
                          </h3>
                        </div>
                        <FontAwesomeIcon icon="box" className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Available Space</p>
                          <h3 className="text-2xl font-bold">
                            {selectedWarehouseData.capacity?.available?.toLocaleString() || '0'} sq ft
                          </h3>
                        </div>
                        <FontAwesomeIcon icon="ruler" className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="zones" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Warehouse Zones</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage and monitor warehouse zones
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddZone(true)}
                  >
                    <FontAwesomeIcon icon="plus" className="mr-2" />
                    Add Zone
                  </Button>
                </div>

                {zonesLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <FontAwesomeIcon icon="spinner" className="h-8 w-8 animate-spin" />
                  </div>
                ) : zones.length === 0 ? (
                  <Card>
                    <div className="p-8 text-center">
                      <FontAwesomeIcon icon="warehouse" className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Zones Found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by adding zones to organize your warehouse space efficiently
                      </p>
                      <Button onClick={() => setShowAddZone(true)}>
                        <FontAwesomeIcon icon="plus" className="mr-2" />
                        Create First Zone
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map((zone) => (
                      <Card key={zone.id}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">{zone.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{zone.type}</Badge>
                                <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                                  {zone.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ZoneUtilizationDialog
                                zone={zone}
                                onUpdate={(updates) =>
                                  updateZoneMutation.mutate({ zoneId: zone.id, updates })
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground">Capacity</span>
                                <span className="text-sm">{zone.capacity?.toLocaleString() || '0'} sq ft</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={zone.utilizationPercentage || 0}
                                  className={cn(
                                    "bg-secondary h-2",
                                    `[&>div]:bg-${getUtilizationColor(zone.utilizationPercentage || 0).replace('text-', '')}`
                                  )}
                                />
                                <span className={`text-sm ${getUtilizationColor(zone.utilizationPercentage || 0)}`}>
                                  {zone.utilizationPercentage || 0}%
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Picking Strategy</p>
                                <p className="font-medium">{zone.pickingStrategy || 'FIFO'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Cross Docking</p>
                                <p className="font-medium">
                                  {zone.allowsCrossDocking ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <ZoneCreateDialog
                  open={showAddZone}
                  onOpenChange={setShowAddZone}
                  onSubmit={(zoneData) => createZoneMutation.mutate(zoneData)}
                  warehouseId={selectedWarehouseData?.id}
                  warehouseCapacity={selectedWarehouseData?.capacity?.available || 0}
                />
              </TabsContent>

              {metrics && (
                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Picking Accuracy</p>
                            <h3 className="text-2xl font-bold">{metrics.pickingAccuracy}%</h3>
                          </div>
                          <FontAwesomeIcon icon="bullseye" className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Orders Processed</p>
                            <h3 className="text-2xl font-bold">{metrics.ordersProcessed}</h3>
                          </div>
                          <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Inventory Turns</p>
                            <h3 className="text-2xl font-bold">{metrics.inventoryTurns}</h3>
                          </div>
                          <FontAwesomeIcon icon="rotate" className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Equipment Utilization</p>
                            <h3 className="text-2xl font-bold">{metrics.equipmentUtilization || 0}%</h3>
                          </div>
                          <FontAwesomeIcon icon="tools" className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
      />
    </div>
  );
}