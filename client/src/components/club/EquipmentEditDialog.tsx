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
import { useToast } from "@/hooks/use-toast";
import { EquipmentImageUpload } from "./EquipmentImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

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
  serialNumber: z.string().optional(),
  modelNumber: z.string().optional(),
  modelYear: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
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
      serialNumber: equipment.serialNumber || undefined,
      modelNumber: equipment.modelNumber || undefined,
      modelYear: equipment.modelYear || undefined,
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
          <DialogDescription>
            Update equipment details and manage settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <FontAwesomeIcon icon="cog" className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="device">
              <FontAwesomeIcon icon="wifi" className="mr-2 h-4 w-4" />
              Device
            </TabsTrigger>
            <TabsTrigger value="image">
              <FontAwesomeIcon icon="image" className="mr-2 h-4 w-4" />
              Image
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}>
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter serial number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="modelNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter model number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="modelYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="Enter model year" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="device">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="image">
                <Card>
                  <CardHeader>
                    <CardTitle>Equipment Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EquipmentImageUpload
                      equipmentId={equipment.id.toString()}
                      currentImageUrl={equipment.imageUrl}
                    />
                    <FormDescription className="mt-2">
                      Upload an image of the equipment. Supported formats: JPG, PNG. Max size: 5MB.
                    </FormDescription>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="mt-6 flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this equipment?")) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  Delete Equipment
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
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}