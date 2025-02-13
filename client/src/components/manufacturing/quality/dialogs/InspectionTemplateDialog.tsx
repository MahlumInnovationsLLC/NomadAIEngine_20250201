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

interface InspectionTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: InspectionTemplateType;
  templates: QualityFormTemplate[];
}

export function InspectionTemplateDialog({
  open,
  onOpenChange,
  type,
  templates,
}: InspectionTemplateDialogProps) {
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
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
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
                  <Button variant="outline" className="w-full">
                    <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FontAwesomeIcon icon="copy" className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}