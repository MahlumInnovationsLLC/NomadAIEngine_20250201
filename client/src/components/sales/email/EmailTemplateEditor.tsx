import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  lastModified: string;
  usageCount: number;
}

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject line is required"),
  content: z.string().min(1, "Email content is required"),
  category: z.string().min(1, "Category is required"),
  variables: z.array(z.string()),
});

const mockTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Product Launch Template",
    subject: "Introducing {product_name} - Revolutionary Manufacturing Solution",
    content: "Dear {contact_name},\n\nWe're excited to introduce {product_name}, our latest manufacturing solution...",
    variables: ["product_name", "contact_name"],
    category: "product_launch",
    lastModified: new Date().toISOString(),
    usageCount: 15
  },
  {
    id: "2",
    name: "Follow-up Template",
    subject: "Following up on {project_name}",
    content: "Hi {contact_name},\n\nI wanted to follow up on our discussion about {project_name}...",
    variables: ["project_name", "contact_name"],
    category: "follow_up",
    lastModified: new Date().toISOString(),
    usageCount: 45
  }
];

export function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      subject: "",
      content: "",
      category: "",
      variables: [],
    },
  });

  const handleSaveTemplate = (data: z.infer<typeof templateSchema>) => {
    const newTemplate: EmailTemplate = {
      id: selectedTemplate?.id || (templates.length + 1).toString(),
      name: data.name,
      subject: data.subject,
      content: data.content,
      category: data.category,
      variables: data.variables,
      lastModified: new Date().toISOString(),
      usageCount: selectedTemplate?.usageCount || 0,
    };

    if (selectedTemplate) {
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? newTemplate : t));
    } else {
      setTemplates([...templates, newTemplate]);
    }

    toast({
      title: "Success",
      description: `Template ${selectedTemplate ? 'updated' : 'created'} successfully`,
    });

    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Success",
      description: "Template deleted successfully",
    });
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage email templates for your campaigns
          </p>
        </div>
        <Button onClick={() => {
          form.reset({
            name: "",
            subject: "",
            content: "",
            category: "",
            variables: []
          });
          setSelectedTemplate(null);
        }}>
          <FontAwesomeIcon icon="plus" className="mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.subject}</div>
                    </div>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Used {template.usageCount} times
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <FontAwesomeIcon icon="eye" className="mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { id, usageCount, lastModified, ...formData } = template;
                          form.reset(formData);
                          setSelectedTemplate(template);
                        }}
                      >
                        <FontAwesomeIcon icon="edit" className="mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <FontAwesomeIcon icon="trash" className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {(selectedTemplate !== null || form.formState.isDirty) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTemplate ? "Edit Template" : "New Template"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSaveTemplate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateCategory">Category</Label>
                  <Select
                    onValueChange={(value) => form.setValue("category", value)}
                    value={form.watch("category")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_launch">Product Launch</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="nurture">Nurture</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateSubject">Subject Line</Label>
                  <Input
                    id="templateSubject"
                    {...form.register("subject")}
                  />
                  {form.formState.errors.subject && (
                    <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateContent">Email Content</Label>
                  <Textarea
                    id="templateContent"
                    {...form.register("content")}
                    className="min-h-[200px] font-mono"
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Use variables like {"{contact_name}"} that will be replaced with actual values
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateVariables">Variables</Label>
                  <Input
                    id="templateVariables"
                    placeholder="contact_name, company_name, product_name"
                    onChange={(e) => {
                      const variables = e.target.value.split(",").map(v => v.trim()).filter(Boolean);
                      form.setValue("variables", variables);
                    }}
                    defaultValue={form.watch("variables")?.join(", ")}
                  />
                  {form.formState.errors.variables && (
                    <p className="text-sm text-red-500">{form.formState.errors.variables.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Comma-separated list of variables used in the template
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset({
                        name: "",
                        subject: "",
                        content: "",
                        category: "",
                        variables: []
                      });
                      setSelectedTemplate(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedTemplate ? "Update Template" : "Save Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Subject</h3>
                <p className="text-muted-foreground">{selectedTemplate.subject}</p>
              </div>
              <div>
                <h3 className="font-medium">Content</h3>
                <div className="p-4 border rounded-lg whitespace-pre-wrap font-mono">
                  {selectedTemplate.content}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Variables Used</h3>
                <div className="flex gap-2 mt-2">
                  {selectedTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}