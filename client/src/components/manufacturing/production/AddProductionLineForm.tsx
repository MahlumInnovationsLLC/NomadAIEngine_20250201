import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ProductionLine } from "@/types/manufacturing";

interface AddProductionLineFormProps {
  onClose: () => void;
}

type ProductionLineType = ProductionLine['type'];

export function AddProductionLineForm({ onClose }: AddProductionLineFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "assembly" as ProductionLineType,
    capacity: {
      planned: 0,
      unit: "units/hour"
    }
  });

  const addProductionLineMutation = useMutation({
    mutationFn: async (data: Partial<ProductionLine>) => {
      const response = await fetch('/api/manufacturing/production-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: "Production line has been added successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newLine = {
      ...formData,
      status: 'operational' as const,
      metrics: [],
      buildStages: [],
      allocatedInventory: [],
      capacity: {
        ...formData.capacity,
        actual: 0,
      },
      performance: {
        efficiency: 100,
        quality: 100,
        availability: 100,
        oee: 100,
      },
      lastMaintenance: new Date().toISOString(),
      nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "",
    };

    await addProductionLineMutation.mutateAsync(newLine);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Production Line Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Main Assembly Line"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Primary assembly line for product X..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value: ProductionLineType) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assembly">Assembly</SelectItem>
            <SelectItem value="machining">Machining</SelectItem>
            <SelectItem value="fabrication">Fabrication</SelectItem>
            <SelectItem value="packaging">Packaging</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Planned Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="0"
            step="0.1"
            value={formData.capacity.planned}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              capacity: {
                ...prev.capacity,
                planned: parseFloat(e.target.value)
              }
            }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacityUnit">Capacity Unit</Label>
          <Select
            value={formData.capacity.unit}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              capacity: {
                ...prev.capacity,
                unit: value
              }
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="units/hour">Units/Hour</SelectItem>
              <SelectItem value="units/shift">Units/Shift</SelectItem>
              <SelectItem value="units/day">Units/Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={addProductionLineMutation.isPending}>
          {addProductionLineMutation.isPending ? "Adding..." : "Add Production Line"}
        </Button>
      </div>
    </form>
  );
}