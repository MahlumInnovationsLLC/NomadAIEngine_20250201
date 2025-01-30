import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
import type { ProductionLine } from "@/types/manufacturing";
import type { InventoryItem, InventoryAllocationEvent } from "@/types/inventory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface InventoryAllocationProps {
  productionLine: ProductionLine;
}

export function InventoryAllocation({ productionLine }: InventoryAllocationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/items'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const allocateMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantity: number }) => {
      const response = await fetch('/api/inventory/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          productionLineId: productionLine.id,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
      toast({
        title: "Success",
        description: "Inventory allocated successfully.",
      });
      setSelectedItem("");
      setQuantity(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAllocate = () => {
    if (!selectedItem || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select an item and specify a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    allocateMutation.mutate({
      itemId: selectedItem,
      quantity,
    });
  };

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-500/10 text-green-500';
      case 'low_stock':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'out_of_stock':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  // Update the filter condition to match the correct enum value
  const inventoryStats = {
    totalItems: inventoryItems.length,
    lowStockItems: inventoryItems.filter(item => item.status === 'low_stock').length,
    outOfStockItems: inventoryItems.filter(item => item.status === 'out_of_stock').length,
  };

  if (isLoadingInventory) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inventory Allocation</h3>
        <div className="flex gap-4">
          <Badge variant="outline" className={inventoryStats.lowStockItems > 0 ? 'bg-yellow-500/10 text-yellow-500' : ''}>
            {inventoryStats.lowStockItems} Low Stock
          </Badge>
          <Badge variant="outline" className={inventoryStats.outOfStockItems > 0 ? 'bg-red-500/10 text-red-500' : ''}>
            {inventoryStats.outOfStockItems} Out of Stock
          </Badge>
        </div>
      </div>

      {inventoryStats.lowStockItems > 0 && (
        <Alert className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some items are running low on stock. Please review inventory levels.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allocate Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Select
                value={selectedItem}
                onValueChange={setSelectedItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => {
                    const isLowStock = item.status === 'low_stock';
                    const isOutOfStock = item.status === 'out_of_stock';

                    return (
                      <SelectItem key={item.id} value={item.id} disabled={isOutOfStock}>
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-2">
                            {item.name}
                            {isLowStock && (
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            )}
                          </span>
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={0}
                placeholder="Quantity"
              />
              {selectedItem && (
                <div className="text-sm text-muted-foreground">
                  Available: {inventoryItems.find(i => i.id === selectedItem)?.quantity || 0} {inventoryItems.find(i => i.id === selectedItem)?.unit}
                </div>
              )}
            </div>

            <Button
              onClick={handleAllocate}
              disabled={allocateMutation.isPending || !selectedItem || quantity <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {allocateMutation.isPending ? "Allocating..." : "Allocate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h4 className="font-medium">Currently Allocated</h4>
        {productionLine.allocatedInventory && productionLine.allocatedInventory.length > 0 ? (
          <div className="grid gap-4">
            {productionLine.allocatedInventory.map((allocation: InventoryAllocationEvent) => {
              const item = inventoryItems.find(i => i.id === allocation.itemId);
              if (!item) return null;

              return (
                <Card key={allocation.itemId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {allocation.quantity} {item.unit}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Badge variant="outline">
                          Allocated
                        </Badge>
                        {item.status === 'low_stock' && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    {item.status === 'low_stock' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Stock Level</span>
                          <span>{Math.round((item.quantity / item.reorderPoint) * 100)}%</span>
                        </div>
                        <Progress value={(item.quantity / item.reorderPoint) * 100} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No inventory allocated
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}