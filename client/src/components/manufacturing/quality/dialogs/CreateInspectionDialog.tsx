import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  fabInspectionTemplates,
  finalQCTemplates,
  executiveReviewTemplates,
  pdiTemplates
} from "@/templates/qualityTemplates";
import type { QualityFormTemplate, InspectionTemplateType } from "@/types/manufacturing";

const inspectionFormSchema = z.object({
  templateId: z.string().min(1, "Please select a template"),
  projectId: z.string().optional(),
  partNumber: z.string().optional(), // Add part number to schema
  productionLineId: z.string().min(1, "Production line is required"),
  inspector: z.string().min(1, "Inspector name is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof inspectionFormSchema>;

interface CreateInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  type: InspectionTemplateType;
  projects?: Array<{ id: string; projectNumber: string; name: string }>;
}

export function CreateInspectionDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  type,
  projects = [],
}: CreateInspectionDialogProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = useMemo(() => {
    switch (type) {
      case 'in-process':
        return fabInspectionTemplates;
      case 'final-qc':
        return finalQCTemplates;
      case 'executive-review':
        return executiveReviewTemplates;
      case 'pdi':
        return pdiTemplates;
      default:
        return [];
    }
  }, [type]);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      type === 'final-qc' 
        ? inspectionFormSchema.extend({
            projectId: z.string().min(1, "Project is required for Final QC inspections")
          })
        : inspectionFormSchema
    ),
    defaultValues: {
      priority: "medium",
      notes: "",
    },
  });

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setValue("templateId", templateId);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const template = templates.find((t) => t.id === values.templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Get project number if project is selected
      let projectNumber = undefined;
      if (values.projectId) {
        const project = projects.find(p => p.id === values.projectId);
        projectNumber = project?.projectNumber;
      }

      const inspectionData = {
        templateType: type,
        templateId: values.templateId,
        projectId: values.projectId,
        projectNumber,
        partNumber: values.partNumber, // Include part number in submission
        inspector: values.inspector,
        productionLineId: values.productionLineId,
        dueDate: values.dueDate,
        priority: values.priority,
        notes: values.notes,
        status: "pending",
        inspectionDate: new Date().toISOString(),
        results: {
          checklistItems: template.sections.flatMap(section =>
            section.fields.map(field => ({
              id: field.id,
              label: field.label,
              type: field.type,
              value: null,
              status: "pending"
            }))
          ),
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
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Inspection</DialogTitle>
          <DialogDescription>
            Create a new quality inspection using a template.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <Select onValueChange={handleTemplateChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
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
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.projectNumber} - {project.name}
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
                    name="partNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter part number (optional)" {...field} />
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
                          <Input placeholder="Enter production line" {...field} />
                        </FormControl>
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
                  <div className="border rounded-lg p-4 mt-4">
                    <h4 className="font-semibold mb-2">Template Preview</h4>
                    {selectedTemplate.sections.map((section) => (
                      <div key={section.id} className="mb-4">
                        <h5 className="font-medium">{section.title}</h5>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {section.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
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
                                {field.type === 'checkbox' && (
                                  <Checkbox disabled />
                                )}
                                {field.type === 'multiselect' && (
                                  <Select disabled>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select options" />
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