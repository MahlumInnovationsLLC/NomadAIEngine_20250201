import { useState } from "react";
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
import { QualityFormTemplate } from "@/types/manufacturing";
import {
  fabInspectionTemplates,
  paintQCTemplates,
  productionQCTemplates,
  finalQCTemplates,
  postDeliveryQCTemplates,
} from "@/templates/qualityTemplates";

const inspectionFormSchema = z.object({
  type: z.enum(["incoming", "in-process", "final", "audit"]),
  templateId: z.string(),
  productionLine: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().optional(),
});

interface CreateInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInspectionDialog({ open, onOpenChange }: CreateInspectionDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);

  const allTemplates = [
    ...fabInspectionTemplates,
    ...paintQCTemplates,
    ...productionQCTemplates,
    ...finalQCTemplates,
    ...postDeliveryQCTemplates,
  ];

  const form = useForm<z.infer<typeof inspectionFormSchema>>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      type: "in-process",
      notes: "",
    },
  });

  const handleTemplateChange = (templateId: string) => {
    const template = allTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const onSubmit = async (values: z.infer<typeof inspectionFormSchema>) => {
    try {
      console.log("Creating inspection:", values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating inspection:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Quality Inspection</DialogTitle>
          <DialogDescription>
            Create a new quality inspection using a template or custom form.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="incoming">Incoming</SelectItem>
                            <SelectItem value="in-process">In-Process</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                            <SelectItem value="audit">Audit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleTemplateChange(value);
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
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
                    name="productionLine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Line</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter production line" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignee" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTemplate && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Template Preview</h4>
                    {selectedTemplate.sections.map((section) => (
                      <div key={section.id} className="mb-4">
                        <h5 className="font-medium">{section.title}</h5>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {section.fields.map((field) => (
                            <div key={field.id}>
                              <label className="text-sm font-medium">{field.label}</label>
                              <div className="mt-1">
                                {field.type === 'text' && <Input disabled placeholder="Text input" />}
                                {field.type === 'number' && <Input disabled type="number" placeholder="0" />}
                                {field.type === 'select' && (
                                  <Select disabled>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select option" />
                                    </SelectTrigger>
                                  </Select>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Inspection</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}