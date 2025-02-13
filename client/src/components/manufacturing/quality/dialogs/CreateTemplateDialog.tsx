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
import { InspectionTemplateType } from "@/types/manufacturing";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  inspectionType: z.enum(['in-process', 'final-qc', 'executive-review', 'pdi'] as const),
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

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({ open, onOpenChange }: CreateTemplateDialogProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<FormValues['sections']>([]);
  const [currentSection, setCurrentSection] = useState<number>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      sections: [],
    },
  });

  const handleAddSection = () => {
    setSections([...sections, {
      title: '',
      description: '',
      fields: [],
    }]);
  };

  const handleAddField = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields.push({
      label: '',
      type: 'text',
      required: false,
    });
    setSections(newSections);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // TODO: Implement template creation logic with WebSocket
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Inspection Template</DialogTitle>
          <DialogDescription>
            Create a new quality inspection template with custom sections and fields.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
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
                    name="inspectionType"
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
                </div>

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

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Template Sections</h4>
                    <Button type="button" variant="outline" onClick={handleAddSection}>
                      <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </div>

                  {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="border rounded-lg p-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`sections.${sectionIndex}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="text-sm font-medium">Fields</h5>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddField(sectionIndex)}
                            >
                              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                              Add Field
                            </Button>
                          </div>

                          {section.fields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className="grid grid-cols-2 gap-4 border-t pt-2">
                              <FormField
                                control={form.control}
                                name={`sections.${sectionIndex}.fields.${fieldIndex}.label`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Field Label</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`sections.${sectionIndex}.fields.${fieldIndex}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Field Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                                        <SelectItem value="checkbox">Checkbox</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="file">File Upload</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Template
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
