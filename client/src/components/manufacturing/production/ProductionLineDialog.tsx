import { useState, useEffect } from "react";
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
  electricalLead: z.object({
    name: z.string().min(1, "Electrical Lead name is required"),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
  }).optional(),
  assemblyLead: z.object({
    name: z.string().min(1, "Assembly Lead name is required"),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
  }).optional(),
  manpowerCapacity: z.number().min(1, "Manpower capacity must be at least 1").optional(),
  teamName: z.string().optional(),
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

  // Function to generate team name from lead names
  const generateTeamName = (electricalLeadName: string = '', assemblyLeadName: string = '') => {
    const getLastName = (fullName: string) => {
      const nameParts = fullName.trim().split(' ');
      return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
    };
    
    const electricalLastName = electricalLeadName ? getLastName(electricalLeadName) : '';
    const assemblyLastName = assemblyLeadName ? getLastName(assemblyLeadName) : '';
    
    if (electricalLastName && assemblyLastName) {
      return `${electricalLastName}-${assemblyLastName} Team`;
    } else if (electricalLastName) {
      return `${electricalLastName} Team`;
    } else if (assemblyLastName) {
      return `${assemblyLastName} Team`;
    }
    return '';
  };

  // Set up form with default values
  const form = useForm<ProductionLineFormValues>({
    resolver: zodResolver(productionLineSchema),
    defaultValues: isEditing
      ? {
          name: productionLine.name,
          description: productionLine.description || "",
          type: productionLine.type,
          capacity: {
            planned: productionLine.capacity?.planned || 0,
            unit: productionLine.capacity?.unit || "units/day",
          },
          electricalLead: productionLine.electricalLead || {
            name: "",
            email: "",
            phone: "",
          },
          assemblyLead: productionLine.assemblyLead || {
            name: "",
            email: "",
            phone: "",
          },
          manpowerCapacity: productionLine.manpowerCapacity || 10,
          teamName: productionLine.teamName || "",
        }
      : {
          name: "",
          description: "",
          type: "assembly",
          capacity: {
            planned: 0,
            unit: "units/day",
          },
          electricalLead: {
            name: "",
            email: "",
            phone: "",
          },
          assemblyLead: {
            name: "",
            email: "",
            phone: "",
          },
          manpowerCapacity: 10,
          teamName: "",
        },
  });

  // Watch electrical and assembly lead names to auto-generate team name
  const electricalLeadName = form.watch("electricalLead.name");
  const assemblyLeadName = form.watch("assemblyLead.name");
  
  // Auto-generate team name when both leads are set and team name is empty
  const currentTeamName = form.watch("teamName");
  
  // Effect to update team name when lead names change
  useEffect(() => {
    if (electricalLeadName || assemblyLeadName) {
      if (!currentTeamName) {
        const newTeamName = generateTeamName(electricalLeadName, assemblyLeadName);
        if (newTeamName) {
          form.setValue("teamName", newTeamName);
        }
      }
    }
  }, [electricalLeadName, assemblyLeadName, currentTeamName, form]);

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

            <div className="space-y-4 border rounded-md p-4 bg-slate-50">
              <h3 className="font-medium text-sm">Team Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Electrical Lead */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Electrical Lead</h4>
                  <FormField
                    control={form.control}
                    name="electricalLead.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="electricalLead.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.smith@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="electricalLead.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Assembly Lead */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Assembly Lead</h4>
                  <FormField
                    control={form.control}
                    name="assemblyLead.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assemblyLead.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assemblyLead.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 987-6543" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name (Auto-generated)</FormLabel>
                      <FormControl>
                        <Input placeholder="Team name will auto-generate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="manpowerCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manpower Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10"
                          {...field}
                          value={field.value || 10}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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