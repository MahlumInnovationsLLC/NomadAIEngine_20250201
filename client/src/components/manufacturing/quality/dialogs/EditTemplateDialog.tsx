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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QualityFormTemplate } from "@/types/manufacturing";
import { useWebSocket } from "@/hooks/use-websocket";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(['in-process', 'final-qc', 'executive-review', 'pdi'] as const),
  description: z.string().min(1, "Description is required"),
  sections: z.array(z.object({
    title: z.string().min(1, "Section title is required"),
    description: z.string().optional(),
    fields: z.array(z.object({
      label: z.string().min(1, "Field label is required"),
      type: z.enum(['text', 'number', 'select', 'multiselect', 'checkbox', 'date', 'file']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })),
  })),
});

type FormValues = z.infer<typeof templateFormSchema>;

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QualityFormTemplate;
  onSuccess: () => void;
}

export function EditTemplateDialog({ open, onOpenChange, template, onSuccess }: EditTemplateDialogProps) {
  const { toast } = useToast();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template.name,
      type: template.type as FormValues['type'],
      description: template.description,
      sections: template.sections.map(section => ({
        title: section.title,
        description: section.description,
        fields: section.fields.map(field => ({
          label: field.label,
          type: field.type as FormValues['sections'][number]['fields'][number]['type'],
          required: field.required,
          options: field.options,
        })),
      })),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      if (!socket) throw new Error('Socket connection not available');

      return new Promise((resolve, reject) => {
        socket.emit('quality:template:update', { id: template.id, ...values }, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      }).then(() => {
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
        onSuccess();
        onOpenChange(false);
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Inspection Template</DialogTitle>
          <DialogDescription>
            Edit the quality inspection template details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 p-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name" {...field} />
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
                      <FormLabel>Inspection Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in-process">In-Process</SelectItem>
                          <SelectItem value="final-qc">Final QC</SelectItem>
                          <SelectItem value="executive-review">Executive Review</SelectItem>
                          <SelectItem value="pdi">PDI</SelectItem>
                        </SelectContent>
                      </Select>
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
                          placeholder="Enter template description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Template'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}