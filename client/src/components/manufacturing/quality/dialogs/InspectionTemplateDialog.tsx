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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QualityFormTemplate } from "@/types/manufacturing";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(["inspection", "audit", "ncr", "capa", "scar"]),
  description: z.string().min(1, "Description is required"),
  sections: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      fields: z.array(
        z.object({
          label: z.string(),
          type: z.enum(["text", "number", "select", "multiselect", "checkbox", "date", "file"]),
          required: z.boolean(),
          options: z.array(z.string()).optional(),
        })
      ),
    })
  ),
});

interface InspectionTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: QualityFormTemplate;
}

export function InspectionTemplateDialog({
  open,
  onOpenChange,
  editTemplate,
}: InspectionTemplateDialogProps) {
  const [sections, setSections] = useState(editTemplate?.sections || []);

  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: editTemplate || {
      name: "",
      type: "inspection",
      description: "",
      sections: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof templateFormSchema>) => {
    try {
      // Implementation for creating/updating template
      console.log("Saving template:", values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: crypto.randomUUID(),
        title: `Section ${sections.length + 1}`,
        fields: [],
      },
    ]);
  };

  const addField = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields.push({
      id: crypto.randomUUID(),
      label: `Field ${newSections[sectionIndex].fields.length + 1}`,
      type: "text",
      required: false,
    });
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields.splice(fieldIndex, 1);
    setSections(newSections);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
          <DialogDescription>
            Design a quality form template by adding sections and fields
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Template Sections</h4>
                <Button type="button" variant="outline" onClick={addSection}>
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-4 flex-1">
                      <Input
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...sections];
                          newSections[sectionIndex].title = e.target.value;
                          setSections(newSections);
                        }}
                        placeholder="Section Title"
                      />
                      <Input
                        value={section.description || ""}
                        onChange={(e) => {
                          const newSections = [...sections];
                          newSections[sectionIndex].description = e.target.value;
                          setSections(newSections);
                        }}
                        placeholder="Section Description (optional)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(sectionIndex)}
                    >
                      <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].fields[fieldIndex].label = e.target.value;
                            setSections(newSections);
                          }}
                          placeholder="Field Label"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value: any) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].fields[fieldIndex].type = value;
                            setSections(newSections);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Field Type" />
                          </SelectTrigger>
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(sectionIndex, fieldIndex)}
                        >
                          <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addField(sectionIndex)}
                    >
                      <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editTemplate ? "Update" : "Create"} Template</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
