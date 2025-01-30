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
import { Plus } from "lucide-react";
import type { ProductionLine } from "@/types/manufacturing";
import type { InventoryItem } from "@/types/inventory";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inventory Allocation</h3>
      </div>

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
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.name}</span>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
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
            {productionLine.allocatedInventory.map((allocation) => {
              const item = inventoryItems.find(i => i.id === allocation.itemId);
              return (
                <Card key={allocation.itemId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {allocation.quantity} {item?.unit}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Allocated
                      </Badge>
                    </div>
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
