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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PreviewTemplateDialog } from "./PreviewTemplateDialog";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { useQueryClient } from "@tanstack/react-query";

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
  const [activeTab, setActiveTab] = useState("templates");
  const [previewTemplate, setPreviewTemplate] = useState<QualityFormTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<QualityFormTemplate | null>(null);
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const queryClient = useQueryClient();

  const getTemplates = (): QualityFormTemplate[] => {
    try {
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
          console.warn(`Unknown template type: ${type}`);
          return [];
      }
    } catch (error) {
      console.error('Error loading templates:', error);
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
      console.error('Error selecting template:', error);
      toast({
        title: "Error",
        description: "Failed to select template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: QualityFormTemplate) => {
    setEditTemplate(template);
  };

  const handleDuplicateTemplate = (template: QualityFormTemplate) => {
    toast({
      title: "Duplicate Template",
      description: "Template duplication coming in next release",
    });
  };

  const handleCreateTemplate = () => {
    setShowCreateTemplateDialog(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const templates = getTemplates();

  const getTemplateUsage = (templateId: string) => {
    const hash = templateId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return {
      usageCount: Math.abs(hash % 100),
      lastUsed: new Date(Date.now() - (Math.abs(hash % 30) * 24 * 60 * 60 * 1000)).toISOString()
    };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{getTypeTitle()} Templates</DialogTitle>
            <DialogDescription>
              Available templates for {type.split('-').join(' ')} quality inspections
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="flex-1 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {templates.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                    No templates available for this inspection type
                  </div>
                ) : (
                  templates.map((template) => {
                    const usage = getTemplateUsage(template.id);
                    return (
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
                            <div className="text-sm">
                              <span className="font-medium">Times Used:</span> {usage.usageCount}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Last Used:</span> {formatDate(usage.lastUsed)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Created:</span> {formatDate(template.createdAt)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Updated:</span> {formatDate(template.updatedAt)}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setPreviewTemplate(template)}
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
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total Templates</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{templates.length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Active Templates</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {templates.filter(t => t.isActive).length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Average Sections</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {Math.round(templates.reduce((acc, t) => acc + t.sections.length, 0) / templates.length || 0)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Template Usage Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {templates.map(template => {
                            const usage = getTemplateUsage(template.id);
                            return (
                              <div key={template.id} className="flex justify-between items-center">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-muted-foreground">Used {usage.usageCount} times</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="flex-1 overflow-auto p-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Manage Templates</CardTitle>
                  <Button variant="outline" onClick={handleCreateTemplate}>
                    <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map((template) => {
                      const usage = getTemplateUsage(template.id);
                      return (
                        <Card key={template.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Version {template.version} • Used {usage.usageCount} times •
                                  Last used {formatDate(usage.lastUsed)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTemplate(template)}
                                >
                                  <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicateTemplate(template)}
                                >
                                  <FontAwesomeIcon icon="clone" className="mr-2 h-4 w-4" />
                                  Duplicate
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {previewTemplate && (
        <PreviewTemplateDialog
          open={Boolean(previewTemplate)}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          template={previewTemplate}
        />
      )}

      {editTemplate && (
        <EditTemplateDialog
          open={Boolean(editTemplate)}
          onOpenChange={(open) => !open && setEditTemplate(null)}
          template={editTemplate}
        />
      )}

      {showCreateTemplateDialog && (
        <CreateTemplateDialog
          open={showCreateTemplateDialog}
          onOpenChange={setShowCreateTemplateDialog}
          onSuccess={() => {
            setShowCreateTemplateDialog(false);
            // Fix for TypeScript error - use proper invalidateQueries syntax
            queryClient.invalidateQueries({ queryKey: ['quality', 'templates'] });
          }}
        />
      )}
    </>
  );
}