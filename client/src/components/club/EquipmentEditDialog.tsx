import { Equipment } from "@db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EquipmentEditDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const equipmentEditSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  deviceType: z.string().optional(),
  deviceIdentifier: z.string().optional(),
  deviceConnectionStatus: z.enum(['connected', 'disconnected', 'pairing']).optional(),
});

type EquipmentEditValues = z.infer<typeof equipmentEditSchema>;

export function EquipmentEditDialog({
  equipment,
  open,
  onOpenChange,
}: EquipmentEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EquipmentEditValues>({
    resolver: zodResolver(equipmentEditSchema),
    defaultValues: {
      name: equipment.name,
      deviceType: equipment.deviceType || undefined,
      deviceIdentifier: equipment.deviceIdentifier || undefined,
      deviceConnectionStatus: equipment.deviceConnectionStatus || undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: EquipmentEditValues) => {
      const response = await fetch(`/api/equipment/${equipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      onOpenChange(false);
      toast({
        title: "Equipment Updated",
        description: "The equipment details have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/equipment/${equipment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete equipment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      onOpenChange(false);
      toast({
        title: "Equipment Deleted",
        description: "The equipment has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
          <DialogDescription>
            Update equipment details and manage device connections
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter equipment name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bluetooth">Bluetooth</SelectItem>
                      <SelectItem value="wifi">WiFi</SelectItem>
                      <SelectItem value="ant">ANT+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of connection for real-time data tracking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Identifier</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter device ID" />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the tracking device
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceConnectionStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select connection status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="disconnected">Disconnected</SelectItem>
                      <SelectItem value="pairing">Pairing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this equipment?")) {
                    deleteMutation.mutate();
                  }
                }}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
