import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ProductionLine } from "../../../types/manufacturing";

// Define schema for production line
const productionLineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["assembly", "machining", "fabrication", "packaging", "testing"]),
  capacity: z.object({
    planned: z.number().min(0, "Capacity must be a positive number"),
    unit: z.string().min(1, "Unit is required"),
  }),
});

type ProductionLineFormValues = z.infer<typeof productionLineSchema>;

type ProductionLineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLine?: ProductionLine;
};

export function ProductionLineDialog({
  open,
  onOpenChange,
  productionLine,
}: ProductionLineDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!productionLine;

  // Set up form with default values
  const form = useForm<ProductionLineFormValues>({
    resolver: zodResolver(productionLineSchema),
    defaultValues: isEditing
      ? {
          name: productionLine.name,
          description: productionLine.description || "",
          type: productionLine.type,
          capacity: {
            planned: productionLine.capacity.planned,
            unit: productionLine.capacity.unit,
          },
        }
      : {
          name: "",
          description: "",
          type: "assembly",
          capacity: {
            planned: 0,
            unit: "units/day",
          },
        },
  });

  // Create mutation for adding a new production line
  const createMutation = useMutation({
    mutationFn: async (values: ProductionLineFormValues) => {
      const response = await fetch("/api/manufacturing/production-lines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create production line");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: "Production line created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create production line",
        variant: "destructive",
      });
    },
  });

  // Update mutation for editing an existing production line
  const updateMutation = useMutation({
    mutationFn: async (values: ProductionLineFormValues) => {
      if (!productionLine) return null;
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          // Keep existing values that aren't in the form
          status: productionLine.status,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update production line");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: "Production line updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update production line",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ProductionLineFormValues) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  // Check if we're in a loading state
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Production Line" : "Add Production Line"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this production line."
              : "Create a new production line in the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Assembly Line A1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Main assembly line for product series A"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="assembly">Assembly</SelectItem>
                      <SelectItem value="machining">Machining</SelectItem>
                      <SelectItem value="fabrication">Fabrication</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity.planned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity.unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="units/day" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}