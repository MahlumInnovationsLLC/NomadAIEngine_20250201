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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportTemplateDialog({ open, onOpenChange }: ImportTemplateDialogProps) {
  const { toast } = useToast();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<QualityFormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      try {
        const fileContent = await file.text();
        const templateData = JSON.parse(fileContent) as QualityFormTemplate;
        setPreviewData(templateData);
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
        description: "Please select a template file to import",
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

      toast({
        title: "Success",
        description: "Template imported successfully",
      });
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
      type: "final-qc",
      description: "A sample template for quality inspections",
      version: 1,
      isActive: true,
      sections: [
        {
          id: "section-1",
          title: "Visual Inspection",
          description: "Check for visual defects",
          fields: [
            {
              id: "field-1",
              label: "Surface Quality",
              type: "select",
              required: true,
              options: ["Excellent", "Good", "Fair", "Poor"],
            },
            {
              id: "field-2",
              label: "Comments",
              type: "text",
              required: false,
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
          <DialogTitle>Import Template</DialogTitle>
          <DialogDescription>
            Import a quality inspection template from a JSON file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
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
            <div className="flex flex-col items-center gap-2">
              <Button variant="outline" onClick={handleDownloadSample}>
                <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
                Download Sample
              </Button>
            </div>
          </div>

          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected file: {selectedFile.name}
            </p>
          )}

          {previewData && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Template Preview</h3>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Name:</p>
                      <p className="text-sm text-muted-foreground">{previewData.name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Type:</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {previewData.type.replace('-', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Description:</p>
                      <p className="text-sm text-muted-foreground">{previewData.description}</p>
                    </div>
                    <div>
                      <p className="font-medium">Sections:</p>
                      <div className="space-y-2">
                        {previewData.sections.map((section) => (
                          <div key={section.id} className="border rounded p-2">
                            <p className="font-medium">{section.title}</p>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                            <div className="mt-2">
                              <p className="text-sm font-medium">Fields:</p>
                              <ul className="list-disc list-inside">
                                {section.fields.map((field) => (
                                  <li key={field.id} className="text-sm text-muted-foreground">
                                    {field.label} ({field.type})
                                    {field.required && " *"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || !previewData || isLoading}
          >
            {isLoading ? "Importing..." : "Import Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}