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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: string;
  location: string;
  totalCapacity: number;
  capacity: {
    total: number;
    used: number;
    available: number;
  };
  utilizationPercentage: number;
}

interface WarehouseEditProps {
  warehouse?: Warehouse;
  isOpen: boolean;
  onClose: () => void;
}

export default function WarehouseEdit({ warehouse, isOpen, onClose }: WarehouseEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    type: warehouse?.type || 'primary',
    location: warehouse?.location || '',
    totalCapacity: warehouse?.totalCapacity || 0,
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/warehouse/${warehouse?.id}`, {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWarehouseMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{warehouse ? 'Edit' : 'Create'} Warehouse</DialogTitle>
          <DialogDescription>
            {warehouse ? 'Update warehouse details' : 'Create a new warehouse'}
          </DialogDescription>
        </DialogHeader>

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
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
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
      </DialogContent>
    </Dialog>
  );
}
