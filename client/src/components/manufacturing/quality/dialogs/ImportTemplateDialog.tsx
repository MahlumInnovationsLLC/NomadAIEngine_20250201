import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QualityFormTemplate } from "@/types/manufacturing";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ImportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportTemplateDialog({ open, onOpenChange, onSuccess }: ImportTemplateDialogProps) {
  const { toast } = useToast();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<QualityFormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("preview");

  const validateTemplate = (template: any): string[] => {
    const errors: string[] = [];

    if (!template.name) errors.push("Template name is required");
    if (!template.type) errors.push("Template type is required");
    if (!template.sections || !Array.isArray(template.sections)) {
      errors.push("Template must have sections array");
    } else {
      template.sections.forEach((section: any, idx: number) => {
        if (!section.title) errors.push(`Section ${idx + 1} must have a title`);
        if (!section.fields || !Array.isArray(section.fields)) {
          errors.push(`Section ${idx + 1} must have fields array`);
        } else {
          section.fields.forEach((field: any, fieldIdx: number) => {
            if (!field.label) errors.push(`Field ${fieldIdx + 1} in section ${idx + 1} must have a label`);
            if (!field.type) errors.push(`Field ${fieldIdx + 1} in section ${idx + 1} must have a type`);
            if (field.type === 'select' || field.type === 'multiselect') {
              if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
                errors.push(`Field ${fieldIdx + 1} in section ${idx + 1} must have options array`);
              }
            }
          });
        }
      });
    }

    return errors;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setValidationErrors([]);

      try {
        const fileContent = await file.text();
        const templateData = JSON.parse(fileContent);
        const errors = validateTemplate(templateData);

        if (errors.length > 0) {
          setValidationErrors(errors);
          setPreviewData(null);
          toast({
            title: "Validation Error",
            description: "The template file contains errors. Please fix them and try again.",
            variant: "destructive",
          });
        } else {
          setPreviewData(templateData as QualityFormTemplate);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid template file format. Please select a valid JSON file.",
          variant: "destructive",
        });
        setSelectedFile(null);
        setPreviewData(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData) {
      toast({
        title: "Error",
        description: "Please select a valid template file to import",
        variant: "destructive",
      });
      return;
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Error",
        description: "Please fix validation errors before importing",
        variant: "destructive",
      });
      return;
    }

    if (!socket) {
      toast({
        title: "Error",
        description: "Socket connection not available",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await new Promise((resolve, reject) => {
        socket.emit('quality:template:create', previewData, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });

        setTimeout(() => reject(new Error('Socket timeout')), 5000);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Success",
        description: "Template imported successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error importing template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleTemplate: QualityFormTemplate = {
      id: "sample-template",
      name: "Sample Quality Inspection Template",
      type: "in-process",
      description: "A comprehensive template for quality inspections",
      version: 1,
      isActive: true,
      sections: [
        {
          id: "visual-inspection",
          title: "Visual Inspection",
          description: "Check for visual defects and appearance",
          fields: [
            {
              id: "surface-quality",
              label: "Surface Quality",
              type: "select",
              required: true,
              options: ["Excellent", "Good", "Fair", "Poor"],
              description: "Assess the overall surface finish"
            },
            {
              id: "defects",
              label: "Visible Defects",
              type: "multiselect",
              required: true,
              options: ["Scratches", "Dents", "Discoloration", "None"],
              description: "Select all visible defects"
            }
          ]
        },
        {
          id: "measurements",
          title: "Measurements",
          description: "Record key measurements",
          fields: [
            {
              id: "length",
              label: "Length (mm)",
              type: "number",
              required: true,
              description: "Measure length in millimeters"
            },
            {
              id: "notes",
              label: "Additional Notes",
              type: "text",
              required: false,
              description: "Any additional observations"
            }
          ]
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleTemplate, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sample_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import Quality Template</DialogTitle>
          <DialogDescription>
            Import a quality inspection template from a JSON file. Download the sample template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleDownloadSample}>
              <FontAwesomeIcon icon="download" className="mr-2" />
              Download Sample Template
            </Button>
            <div className="flex-1">
              <label
                htmlFor="template-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FontAwesomeIcon icon="cloud-arrow-up" className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">JSON files only</p>
                </div>
                <input
                  id="template-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Selected file: {selectedFile.name}
              </p>
              <Badge variant={validationErrors.length > 0 ? "destructive" : "success"}>
                {validationErrors.length > 0 ? "Invalid" : "Valid"}
              </Badge>
            </div>
          )}

          {validationErrors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Validation Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {previewData && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <Card>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold">{previewData.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{previewData.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge>{previewData.type}</Badge>
                            <Badge variant="outline">v{previewData.version}</Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {previewData.sections.map((section) => (
                            <Card key={section.id}>
                              <CardHeader>
                                <CardTitle className="text-base">{section.title}</CardTitle>
                                {section.description && (
                                  <p className="text-sm text-muted-foreground">{section.description}</p>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="grid gap-4">
                                  {section.fields.map((field) => (
                                    <div key={field.id} className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{field.label}</span>
                                        {field.required && (
                                          <Badge variant="destructive" className="text-[10px]">Required</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{field.description}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">{field.type}</Badge>
                                        {field.options && (
                                          <span className="text-sm text-muted-foreground">
                                            {field.options.join(", ")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="json">
                <Card>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[300px] rounded-md border">
                      <pre className="p-4 text-sm">
                        {JSON.stringify(previewData, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {isLoading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Importing template... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !previewData || isLoading || validationErrors.length > 0}
          >
            {isLoading ? "Importing..." : "Import Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}