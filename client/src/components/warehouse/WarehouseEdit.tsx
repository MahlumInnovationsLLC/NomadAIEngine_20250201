import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { Warehouse, WarehouseMetrics, WarehouseZone } from "@/types/material";
import { ZoneUtilizationDialog } from "../material/warehouse/ZoneUtilizationDialog";
import { ZoneCreateDialog } from "../material/warehouse/ZoneCreateDialog";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WarehouseEditProps {
  warehouse?: Warehouse;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (warehouseId: string, updates: Partial<Warehouse>) => void;
}

type WarehouseFormData = {
  name: string;
  code: string;
  type: 'primary' | 'secondary' | 'distribution';
  location: string;
  totalCapacity: number;
};

export default function WarehouseEdit({ warehouse, isOpen, onClose, onUpdate }: WarehouseEditProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    code: '',
    type: 'primary',
    location: '',
    totalCapacity: 0,
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || '',
        code: warehouse.code || '',
        type: warehouse.type || 'primary',
        location: warehouse.location || '',
        totalCapacity: warehouse.capacity?.total || 0,
      });
    }
  }, [warehouse]);

  const { data: metrics } = useQuery<WarehouseMetrics>({
    queryKey: ['/api/warehouse/metrics', warehouse?.id],
    enabled: !!warehouse?.id,
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery<WarehouseZone[]>({
    queryKey: ['/api/warehouse/zones', warehouse?.id],
    enabled: !!warehouse?.id,
    retry: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updates: Partial<Warehouse> = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        location: formData.location,
        capacity: {
          total: formData.totalCapacity,
          used: warehouse?.capacity?.used || 0,
          available: formData.totalCapacity - (warehouse?.capacity?.used || 0),
        },
      };

      if (warehouse?.id) {
        await onUpdate(warehouse.id, updates);
      } else {
        const response = await fetch('/api/warehouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to create warehouse');
        }

        const newWarehouse = await response.json();
        onUpdate(newWarehouse.id, updates);
      }

      onClose();
    } catch (error) {
      console.error('Warehouse update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update warehouse",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!warehouse?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/warehouse/${warehouse.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete warehouse');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/warehouse'] });
      toast({
        title: "Warehouse Deleted",
        description: "Successfully deleted the warehouse.",
      });
      onClose();
    } catch (error) {
      console.error('Delete warehouse error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete warehouse",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
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

                <DialogFooter>
                  <div className="flex justify-between w-full">
                    {warehouse && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon="trash" className="mr-2" />
                        Delete Warehouse
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && (
                          <FontAwesomeIcon icon="spinner" className="h-4 w-4 animate-spin mr-2" />
                        )}
                        {warehouse ? 'Update' : 'Create'} Warehouse
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </TabsContent>

            {warehouse && metrics && (
              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Picking Accuracy</p>
                          <h3 className="text-2xl font-bold">{metrics.pickingAccuracy}%</h3>
                        </div>
                        <FontAwesomeIcon icon="bullseye" className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Orders Processed</p>
                          <h3 className="text-2xl font-bold">{metrics.ordersProcessed}</h3>
                        </div>
                        <FontAwesomeIcon icon="boxes-stacked" className="h-8 w-8 text-yellow-500" />
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Inventory Turns</p>
                          <h3 className="text-2xl font-bold">{metrics.inventoryTurns}</h3>
                        </div>
                        <FontAwesomeIcon icon="rotate" className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Equipment Utilization</p>
                          <h3 className="text-2xl font-bold">{metrics.equipmentUtilization || 0}%</h3>
                        </div>
                        <FontAwesomeIcon icon="tools" className="h-8 w-8 text-purple-500" />
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            )}

            {warehouse && (
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
                                onUpdate={(updates) => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', warehouse?.id] });
                                }}
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
                  onSubmit={(zoneData) => {
                    queryClient.invalidateQueries({ queryKey: ['/api/warehouse/zones', warehouse?.id] });
                    setShowAddZone(false);
                  }}
                  warehouseId={warehouse?.id || ''}
                  warehouseCapacity={warehouse?.capacity?.available || 0}
                />
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this warehouse? This action cannot be undone.
              All associated zones and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <FontAwesomeIcon icon="spinner" className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FontAwesomeIcon icon="trash" className="mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { WarehouseEdit };