import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { QualityFormTemplate } from "@/types/manufacturing";
import { useWebSocket } from "@/hooks/use-websocket";
import { CreateTemplateDialog } from "./dialogs/CreateTemplateDialog";
import { EditTemplateDialog } from "./dialogs/EditTemplateDialog";
import { ImportTemplateDialog } from "./dialogs/ImportTemplateDialog";
import { Badge } from "@/components/ui/badge";
import {
  fabInspectionTemplates,
  paintQCTemplates,
  finalQCTemplates,
  executiveReviewTemplates,
  pdiTemplates,
} from "@/templates/qualityTemplates";

type TemplateType = 'inspection' | 'ncr' | 'capa' | 'scar' | 'mrb';

interface TemplateManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType: TemplateType;
}

export default function TemplateManagement({ open, onOpenChange, templateType }: TemplateManagementProps) {
  const { toast } = useToast();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);
  const [templates, setTemplates] = useState<QualityFormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);

      // Initialize with local templates first
      let initialTemplates: QualityFormTemplate[] = [];
      if (templateType === 'inspection') {
        initialTemplates = [
          ...fabInspectionTemplates,
          ...paintQCTemplates,
          ...finalQCTemplates,
          ...executiveReviewTemplates,
          ...pdiTemplates
        ].filter(template => template.type === 'inspection');
      }

      // Set initial templates
      setTemplates(initialTemplates);

      // Fetch additional templates from server if socket is available
      if (socket) {
        socket.emit('quality:template:list', { type: templateType }, (response: { templates?: QualityFormTemplate[], error?: string }) => {
          if (response?.error) {
            console.error('Template fetch error:', response.error);
            if (initialTemplates.length === 0) {
              setError(`No ${templateType} templates available`);
            }
          } else if (Array.isArray(response?.templates)) {
            const serverTemplates = response.templates.filter(t => t.type === templateType);
            setTemplates(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const newTemplates = serverTemplates.filter(t => !existingIds.has(t.id));
              return [...prev, ...newTemplates];
            });
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }
  }, [open, templateType, socket]);

  const handleExportTemplate = (template: QualityFormTemplate) => {
    try {
      const templateCopy = { ...template };
      delete (templateCopy as any)._id;
      delete (templateCopy as any).__v;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templateCopy, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `template_${template.name.toLowerCase().replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      toast({
        title: "Success",
        description: "Template exported successfully",
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: "Error",
        description: "Failed to export template",
        variant: "destructive",
      });
    }
  };

  const categoryDisplayNames: Record<TemplateType, string> = {
    inspection: 'Quality Inspections',
    ncr: 'Non-Conformance Reports',
    capa: 'Corrective Actions',
    scar: 'Supplier Corrective Actions',
    mrb: 'Material Review Board'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-semibold">
            {categoryDisplayNames[templateType]} Templates
          </DialogTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 hover:bg-accent py-2 px-4"
            >
              <FontAwesomeIcon icon="file-import" className="h-4 w-4" />
              <span>Import Template</span>
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 py-2 px-4"
            >
              <FontAwesomeIcon icon="plus" className="h-4 w-4" />
              <span>Create Template</span>
            </Button>
          </div>
        </DialogHeader>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
                      Loading templates...
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {error || `No ${templateType} templates found`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create a new template or import an existing one to get started
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowEditDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <FontAwesomeIcon icon="pen-to-square" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportTemplate(template)}
                            className="h-8 w-8 p-0"
                          >
                            <FontAwesomeIcon icon="download" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {showCreateDialog && (
          <CreateTemplateDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            templateType={templateType}
            onSuccess={(createdTemplate: QualityFormTemplate) => {
              setShowCreateDialog(false);
              setTemplates(prev => [...prev, createdTemplate]);
            }}
          />
        )}

        {showEditDialog && selectedTemplate && (
          <EditTemplateDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            template={selectedTemplate}
            onSuccess={() => {
              setShowEditDialog(false);
              setTemplates(prev => prev.map(t =>
                t.id === selectedTemplate.id ? { ...selectedTemplate, version: selectedTemplate.version + 1 } : t
              ));
            }}
          />
        )}

        {showImportDialog && (
          <ImportTemplateDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            templateType={templateType}
            onSuccess={(importedTemplate: QualityFormTemplate) => {
              setShowImportDialog(false);
              setTemplates(prev => [...prev, importedTemplate]);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}