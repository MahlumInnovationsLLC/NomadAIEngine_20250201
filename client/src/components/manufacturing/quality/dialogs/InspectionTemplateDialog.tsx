import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QualityFormTemplate } from "@/types/manufacturing";
import type { InspectionTemplateType } from "@/types/manufacturing";
import {
  fabInspectionTemplates,
  finalQCTemplates,
  executiveReviewTemplates,
  pdiTemplates,
} from "@/templates/qualityTemplates";
import { useToast } from "@/hooks/use-toast";

interface InspectionTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: InspectionTemplateType;
  onSelectTemplate?: (template: QualityFormTemplate) => void;
}

export function InspectionTemplateDialog({
  open,
  onOpenChange,
  type,
  onSelectTemplate
}: InspectionTemplateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getTemplates = (): QualityFormTemplate[] => {
    switch (type) {
      case 'final-qc':
        return finalQCTemplates;
      case 'in-process':
        return fabInspectionTemplates;
      case 'executive-review':
        return executiveReviewTemplates;
      case 'pdi':
        return pdiTemplates;
      default:
        return [];
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'final-qc':
        return 'Final Quality Control';
      case 'in-process':
        return 'In-Process Inspection';
      case 'executive-review':
        return 'Executive Review';
      case 'pdi':
        return 'Pre-Delivery Inspection';
      default:
        return 'Quality Inspection';
    }
  };

  const handleUseTemplate = async (template: QualityFormTemplate) => {
    setLoading(true);
    try {
      if (onSelectTemplate) {
        onSelectTemplate(template);
      }
      toast({
        title: "Template Selected",
        description: `Selected template: ${template.name}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const templates = getTemplates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTypeTitle()} Templates</DialogTitle>
          <DialogDescription>
            Available templates for {type.split('-').join(' ')} quality inspections
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto py-4">
          {templates.length === 0 ? (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              No templates available for this inspection type
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Version:</span> {template.version}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Sections:</span> {template.sections.length}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Preview",
                          description: "Template preview coming soon",
                        });
                      }}
                    >
                      <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button 
                      className="w-full"
                      disabled={loading}
                      onClick={() => handleUseTemplate(template)}
                    >
                      <FontAwesomeIcon icon="copy" className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}