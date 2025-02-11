import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { Warehouse, WarehouseMetrics, WarehouseZone } from "@/types/material";
import { ZoneUtilizationDialog } from "../material/warehouse/ZoneUtilizationDialog";
import { ZoneCreateDialog } from "../material/warehouse/ZoneCreateDialog";

interface WarehouseEditProps {
  warehouse?: Warehouse;
  isOpen: boolean;
  onClose: () => void;
}

type WarehouseFormData = {
  name: string;
  code: string;
  type: 'primary' | 'secondary' | 'distribution';
  location: string;
  totalCapacity: number;
};

export default function WarehouseEdit({ warehouse, isOpen, onClose }: WarehouseEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [showAddZone, setShowAddZone] = useState(false);
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    type: warehouse?.type || 'primary',
    location: warehouse?.location || '',
    totalCapacity: warehouse?.totalCapacity || 0,
  });

  // Fetch warehouse metrics if editing
  const { data: metrics } = useQuery<WarehouseMetrics>({
    queryKey: ['/api/warehouse/metrics', warehouse?.id],
    enabled: !!warehouse?.id,
  });

  // Fetch warehouse zones if editing
  const { data: zones = [], isLoading: zonesLoading } = useQuery<WarehouseZone[]>({
    queryKey: ['/api/warehouse/zones', warehouse?.id],
    enabled: !!warehouse?.id,
    retry: 3,
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      const response = await fetch(`/api/warehouse/${warehouse?.id || ''}`, {
        method: warehouse ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update warehouse');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse'] });
      toast({
        title: `Warehouse ${warehouse ? 'Updated' : 'Created'}`,
        description: `Successfully ${warehouse ? 'updated' : 'created'} warehouse.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', warehouse?.id] });
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
    mutationFn: async (zoneData: Omit<WarehouseZone, 'id'>) => {
      const response = await fetch(`/api/warehouse/${warehouse?.id}/zones`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', warehouse?.id] });
      toast({
        title: "Zone Created",
        description: "The zone has been successfully created.",
      });
      setShowAddZone(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWarehouseMutation.mutate(formData);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  const [zoneFormData, setZoneFormData] = useState<Partial<WarehouseZone>>({});
  const handleZoneFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoneFormData({ ...zoneFormData, [e.target.name]: e.target.value });
  };

  const handleCreateZone = () => {
    createZoneMutation.mutate(zoneFormData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{warehouse ? 'Edit' : 'Create'} Warehouse</DialogTitle>
          <DialogDescription>
            {warehouse ? 'Update warehouse details' : 'Create a new warehouse'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            {warehouse && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
            {warehouse && <TabsTrigger value="zones">Zones</TabsTrigger>}
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Warehouse Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'primary' | 'secondary' | 'distribution') =>
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCapacity">Total Capacity (sq ft)</Label>
                <Input
                  id="totalCapacity"
                  type="number"
                  value={formData.totalCapacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalCapacity: parseInt(e.target.value) }))}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {warehouse ? 'Update' : 'Create'} Warehouse
                </Button>
              </div>
            </form>
          </TabsContent>

          {warehouse && metrics && (
            <TabsContent value="metrics">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <div className="p-4">
                    <h3 className="font-semibold mb-4">Efficiency Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Picking Accuracy</span>
                          <Badge variant="secondary">{metrics.pickingAccuracy}%</Badge>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Orders Processed</span>
                          <Badge variant="secondary">{metrics.ordersProcessed}</Badge>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Inventory Turns</span>
                          <Badge variant="secondary">{metrics.inventoryTurns}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <h3 className="font-semibold mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Avg Dock Time</span>
                          <Badge variant="secondary">{metrics.avgDockTime} mins</Badge>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Labor Efficiency</span>
                          <Badge variant="secondary">{metrics.laborEfficiency}%</Badge>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Inventory Accuracy</span>
                          <Badge variant="secondary">{metrics.inventoryAccuracy}%</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          )}

          {warehouse && (
            <TabsContent value="zones">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Warehouse Zones</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddZone(true)}>
                    <FontAwesomeIcon icon="plus" className="mr-2" />
                    Add Zone
                  </Button>
                </div>
                {zonesLoading ? (
                  <p>Loading zones...</p>
                ) : zones.length === 0 ? (
                  <p>No zones found.</p>
                ) : (
                  zones.map((zone) => (
                    <Card key={zone.id}>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{zone.name}</h3>
                            <p className="text-sm text-muted-foreground">{zone.type}</p>
                          </div>
                          <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                            {zone.status}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-grow bg-secondary h-2 rounded-full">
                              <div
                                className={`h-full rounded-full ${getUtilizationColor(zone.utilizationPercentage)}`}
                                style={{ width: `${zone.utilizationPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{zone.utilizationPercentage}%</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Capacity: {zone.capacity.toLocaleString()} sq ft
                          </p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="edit" className="mr-2" />
                            Edit
                          </Button>
                          <ZoneUtilizationDialog
                            zone={zone}
                            onUpdate={(updates) =>
                              updateZoneMutation.mutate({ zoneId: zone.id, updates })
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
                <ZoneCreateDialog
                  open={showAddZone}
                  onOpenChange={setShowAddZone}
                  onSubmit={(zoneData) => createZoneMutation.mutate(zoneData)}
                  warehouseCapacity={warehouse?.capacity?.available || 0}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}