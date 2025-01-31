import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QualityInspection } from "@/types/manufacturing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ncrFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["product", "process", "material", "documentation"]),
  severity: z.enum(["minor", "major", "critical"]),
  area: z.string().min(1, "Area is required"),
  productLine: z.string().optional(),
  lotNumber: z.string().optional(),
  quantityAffected: z.number().optional(),
  disposition: z.enum([
    "use_as_is",
    "rework",
    "repair",
    "scrap",
    "return_to_supplier",
    "pending",
  ]),
  containmentActions: z.array(
    z.object({
      action: z.string(),
      assignedTo: z.string(),
      dueDate: z.string(),
    })
  ),
});

interface NCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection?: QualityInspection;
  defaultValues?: any;
}

export function NCRDialog({ open, onOpenChange, inspection, defaultValues }: NCRDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof ncrFormSchema>>({
    resolver: zodResolver(ncrFormSchema),
    defaultValues: defaultValues || {
      title: inspection ? `NCR: ${inspection.templateType} - ${inspection.productionLineId}` : "",
      description: "",
      type: "product",
      severity: "major",
      area: inspection?.productionLineId || "",
      productLine: inspection?.productionLineId || "",
      disposition: "pending",
      containmentActions: [
        {
          action: "",
          assignedTo: "",
          dueDate: new Date().toISOString().split("T")[0],
        },
      ],
    },
  });

  const createNCRMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ncrFormSchema>) => {
      const response = await fetch('/api/manufacturing/quality/ncrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          number: `NCR-${Date.now()}`, // Generate a unique NCR number
          status: 'draft',
          reportedBy: "Current User", // This should be replaced with actual user info
          inspectionId: inspection?.id, // Link to the source inspection
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create NCR');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      onOpenChange(false);
      toast({
        title: 'Success',
        description: 'NCR has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (values: z.infer<typeof ncrFormSchema>) => {
    try {
      await createNCRMutation.mutateAsync(values);
    } catch (error) {
      console.error("Error creating NCR:", error);
    }
  };

  const addContainmentAction = () => {
    const currentActions = form.getValues("containmentActions");
    form.setValue("containmentActions", [
      ...currentActions,
      {
        action: "",
        assignedTo: "",
        dueDate: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const removeContainmentAction = (index: number) => {
    const currentActions = form.getValues("containmentActions");
    form.setValue(
      "containmentActions",
      currentActions.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Non-Conformance Report</DialogTitle>
          <DialogDescription>
            Create a new NCR based on the inspection findings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter NCR title" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="process">Process</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the non-conformance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disposition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select disposition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="use_as_is">Use As Is</SelectItem>
                        <SelectItem value="rework">Rework</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="scrap">Scrap</SelectItem>
                        <SelectItem value="return_to_supplier">Return to Supplier</SelectItem>
                        <SelectItem value="pending">Pending Decision</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter affected area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Line</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product line" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lot number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityAffected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Affected</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Containment Actions</h4>
                <Button type="button" variant="outline" onClick={addContainmentAction}>
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </div>

              {form.watch("containmentActions").map((_, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name={`containmentActions.${index}.action`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Action description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`containmentActions.${index}.assignedTo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Assigned to" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`containmentActions.${index}.dueDate`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContainmentAction(index)}
                    >
                      <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create NCR</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}