import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import type { QualityInspection } from "@/types/manufacturing";

const inspectionFormSchema = z.object({
  templateType: z.enum(['inspection', 'audit', 'ncr', 'capa', 'scar']),
  inspector: z.string().min(1, "Inspector name is required"),
  productionLineId: z.string().min(1, "Production line is required"),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof inspectionFormSchema>;

interface CreateInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<QualityInspection>) => void;
}

export function CreateInspectionDialog({ open, onOpenChange, onSubmit }: CreateInspectionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      templateType: 'inspection',
      status: 'pending',
      notes: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const inspectionData: Partial<QualityInspection> = {
        ...values,
        inspectionDate: new Date().toISOString(),
        results: {
          checklistItems: [],
          defectsFound: [],
        },
      };

      await onSubmit(inspectionData);

      form.reset();
      onOpenChange(false);

      toast({
        title: "Success",
        description: "New inspection has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating inspection:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create inspection",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Inspection</DialogTitle>
          <DialogDescription>
            Create a new quality inspection record. Fill out the required information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="templateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="ncr">NCR</SelectItem>
                      <SelectItem value="capa">CAPA</SelectItem>
                      <SelectItem value="scar">SCAR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inspector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter inspector name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productionLineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Line</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter production line ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Inspection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}