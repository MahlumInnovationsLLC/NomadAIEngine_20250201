import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { Material, Warehouse } from "@/types/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const materialAllocationSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  productionOrderId: z.string().min(1, "Production order is required"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  requiredDate: z.date(),
});

type MaterialAllocationFormValues = z.infer<typeof materialAllocationSchema>;

interface MaterialAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  warehouses: Warehouse[];
}

export function MaterialAllocationDialog({
  open,
  onOpenChange,
  materials,
}: MaterialAllocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<MaterialAllocationFormValues>({
    resolver: zodResolver(materialAllocationSchema),
    defaultValues: {
      priority: "medium",
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    },
  });

  const allocateMaterialMutation = useMutation({
    mutationFn: async (values: MaterialAllocationFormValues) => {
      const response = await fetch("/api/material/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to allocate material");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material/inventory/stats"] });
      form.reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (values: MaterialAllocationFormValues) => {
    setIsSubmitting(true);
    try {
      await allocateMaterialMutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMaterial = materials.find(
    (m) => m.id === form.watch("materialId")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon="tasks" className="h-5 w-5" />
            Material Allocation
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.sku}) - Available: {material.availableStock} {material.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                      <span className="text-muted-foreground">
                        {selectedMaterial?.unit}
                      </span>
                    </div>
                  </FormControl>
                  {selectedMaterial && (
                    <p className="text-sm text-muted-foreground">
                      Available: {selectedMaterial.availableStock} {selectedMaterial.unit}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productionOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Order</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter production order ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  "Allocate Material"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
