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
import { Switch } from "@/components/ui/switch";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { v4 as uuidv4 } from 'uuid';

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(['in-process', 'final-qc', 'executive-review', 'pdi'] as const),
  description: z.string().min(1, "Description is required"),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Section title is required"),
    description: z.string().optional(),
    fields: z.array(z.object({
      id: z.string(),
      label: z.string().min(1, "Field label is required"),
      type: z.enum(['text', 'number', 'select', 'multiselect', 'checkbox', 'date', 'file']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
    })),
  })).min(1, "At least one section is required"),
});

type FormValues = z.infer<typeof templateFormSchema>;

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTemplateDialog({ open, onOpenChange, onSuccess }: CreateTemplateDialogProps) {
  const { toast } = useToast();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      sections: [{
        id: uuidv4(),
        title: '',
        description: '',
        fields: [{
          id: uuidv4(),
          label: '',
          type: 'text',
          required: false,
        }],
      }],
    },
  });

  const handleAddSection = () => {
    const sections = form.getValues('sections');
    form.setValue('sections', [
      ...sections,
      {
        id: uuidv4(),
        title: '',
        description: '',
        fields: [{
          id: uuidv4(),
          label: '',
          type: 'text',
          required: false,
        }],
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    const sections = form.getValues('sections');
    if (sections.length > 1) {
      form.setValue('sections', sections.filter((_, i) => i !== index));
    }
  };

  const handleAddField = (sectionIndex: number) => {
    const sections = form.getValues('sections');
    sections[sectionIndex].fields.push({
      id: uuidv4(),
      label: '',
      type: 'text',
      required: false,
    });
    form.setValue(`sections`, sections);
  };

  const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
    const sections = form.getValues('sections');
    if (sections[sectionIndex].fields.length > 1) {
      sections[sectionIndex].fields = sections[sectionIndex].fields.filter((_, i) => i !== fieldIndex);
      form.setValue(`sections`, sections);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      if (!socket) throw new Error('Socket connection not available');

      // Add metadata
      const template = {
        ...values,
        id: uuidv4(),
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return new Promise((resolve, reject) => {
        socket.emit('quality:template:create', template, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      }).then(() => {
        toast({
          title: "Success",
          description: "Template created successfully",
        });
        form.reset();
        onSuccess?.();
        onOpenChange(false);
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Quality Inspection Template</DialogTitle>
          <DialogDescription>
            Design a new quality inspection template with custom sections and fields
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6 p-4">
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in-process">In-Process Inspection</SelectItem>
                          <SelectItem value="final-qc">Final Quality Control</SelectItem>
                          <SelectItem value="executive-review">Executive Review</SelectItem>
                          <SelectItem value="pdi">Pre-Delivery Inspection</SelectItem>
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
                  <h4 className="text-lg font-medium">Template Sections</h4>
                  <Button type="button" variant="outline" onClick={handleAddSection}>
                    <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </div>

                {form.getValues('sections').map((section, sectionIndex) => (
                  <Card key={section.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSection(sectionIndex)}
                          disabled={form.getValues('sections').length === 1}
                        >
                          <FontAwesomeIcon icon="trash" className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`sections.${sectionIndex}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter section title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sections.${sectionIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter section description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">Fields</h5>
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
                            <div key={field.id} className="relative border rounded-lg p-4">
                              <div className="absolute top-2 right-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveField(sectionIndex, fieldIndex)}
                                  disabled={section.fields.length === 1}
                                >
                                  <FontAwesomeIcon icon="times" className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`sections.${sectionIndex}.fields.${fieldIndex}.label`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Field Label</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter field label" {...field} />
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

                              <div className="mt-2 flex items-center gap-2">
                                <FormField
                                  control={form.control}
                                  name={`sections.${sectionIndex}.fields.${fieldIndex}.required`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="!mt-0">Required Field</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}