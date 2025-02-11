import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import type { Warehouse, WarehouseZone, WarehouseMetrics } from "@/types/material";
import { ZoneUtilizationDialog } from "./ZoneUtilizationDialog";

interface WarehouseManagementProps {
  selectedWarehouse: string | null;
  onWarehouseSelect: (warehouseId: string) => void;
}

export function WarehouseManagement({
  selectedWarehouse,
  onWarehouseSelect
}: WarehouseManagementProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch warehouses
  const { data: warehouses = [], isLoading: isLoadingWarehouses, error: warehousesError } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouse'],
    retry: 3,
  });

  // Fetch warehouse metrics
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery<WarehouseMetrics>({
    queryKey: ['/api/warehouse/metrics', selectedWarehouse],
    enabled: !!selectedWarehouse,
    retry: 3,
  });

  // Fetch warehouse zones
  const { data: zones = [], isLoading: isLoadingZones, error: zonesError } = useQuery<WarehouseZone[]>({
    queryKey: ['/api/warehouse/zones', selectedWarehouse],
    enabled: !!selectedWarehouse,
    retry: 3,
  });

  // Update zone mutation
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

  const selectedWarehouseData = warehouses.find(w => w.id === selectedWarehouse);

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  // Handle loading states and errors
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
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/warehouse'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Warehouse Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor warehouse operations across facilities
          </p>
        </div>
      </div>

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((warehouse) => (
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
                <Badge>{warehouse.type}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Location: {warehouse.location}</p>
                <p>Capacity: {warehouse.capacity.total.toLocaleString()} sq ft</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-grow bg-secondary h-2 rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        getUtilizationColor(warehouse.utilizationPercentage)
                      }`}
                      style={{ width: `${warehouse.utilizationPercentage}%` }}
                    />
                  </div>
                  <span className={getUtilizationColor(warehouse.utilizationPercentage)}>
                    {warehouse.utilizationPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Warehouse Details */}
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

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Space</p>
                          <h3 className="text-2xl font-bold">
                            {selectedWarehouseData.capacity.total.toLocaleString()} sq ft
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
                            {selectedWarehouseData.capacity.used.toLocaleString()} sq ft
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
                            {selectedWarehouseData.capacity.available.toLocaleString()} sq ft
                          </h3>
                        </div>
                        <FontAwesomeIcon icon="ruler" className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Zones Tab */}
              <TabsContent value="zones" className="space-y-4">
                {isLoadingZones ? (
                  <div className="flex items-center justify-center h-48">
                    <FontAwesomeIcon icon="spinner" className="h-8 w-8 animate-spin" />
                  </div>
                ) : zonesError ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <FontAwesomeIcon icon="exclamation-triangle" className="h-8 w-8 text-red-500" />
                    <p>Failed to load zones</p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', selectedWarehouse] })}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.map((zone) => (
                        <TableRow key={zone.id}>
                          <TableCell className="font-medium">{zone.id}</TableCell>
                          <TableCell>{zone.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{zone.type}</Badge>
                          </TableCell>
                          <TableCell>{zone.capacity.toLocaleString()} sq ft</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-grow bg-secondary h-2 rounded-full w-[100px]">
                                <div
                                  className={`h-full rounded-full ${
                                    getUtilizationColor(zone.utilizationPercentage)
                                  }`}
                                  style={{ width: `${zone.utilizationPercentage}%` }}
                                />
                              </div>
                              <span>{zone.utilizationPercentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                              {zone.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <ZoneUtilizationDialog
                              zone={zone}
                              onUpdate={(updates) =>
                                updateZoneMutation.mutate({ zoneId: zone.id, updates })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="space-y-4">
                {isLoadingMetrics ? (
                  <div className="flex items-center justify-center h-48">
                    <FontAwesomeIcon icon="spinner" className="h-8 w-8 animate-spin" />
                  </div>
                ) : metricsError ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <FontAwesomeIcon icon="exclamation-triangle" className="h-8 w-8 text-red-500" />
                    <p>Failed to load metrics</p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/warehouse/metrics', selectedWarehouse] })}>
                      Retry
                    </Button>
                  </div>
                ) : metrics ? (
                  <div className="space-y-6">
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
                          <p className="text-sm text-muted-foreground mt-2">
                            Order picking accuracy rate
                          </p>
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
                          <p className="text-sm text-muted-foreground mt-2">
                            Total orders processed this month
                          </p>
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
                          <p className="text-sm text-muted-foreground mt-2">
                            Annual inventory turnover rate
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Avg Dock Time</p>
                              <h3 className="text-2xl font-bold">{metrics.avgDockTime} mins</h3>
                            </div>
                            <FontAwesomeIcon icon="clock" className="h-8 w-8 text-purple-500" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Average loading/unloading time
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Efficiency Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Order Fulfillment Time</span>
                                <span className="text-sm font-medium">
                                  {metrics.orderFulfillmentTime} hours
                                </span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (metrics.orderFulfillmentTime / 48) * 100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Labor Efficiency</span>
                                <span className="text-sm font-medium">
                                  {metrics.laborEfficiency}%
                                </span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${metrics.laborEfficiency}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Accuracy Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Inventory Accuracy</span>
                                <span className="text-sm font-medium">
                                  {metrics.inventoryAccuracy}%
                                </span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full">
                                <div
                                  className="h-full bg-yellow-500 rounded-full"
                                  style={{ width: `${metrics.inventoryAccuracy}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">Capacity Utilization</span>
                                <span className="text-sm font-medium">
                                  {metrics.capacityUtilization}%
                                </span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${metrics.capacityUtilization}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No metrics available for this warehouse
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}