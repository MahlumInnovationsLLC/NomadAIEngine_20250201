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

interface TemplateManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplateManagement({ open, onOpenChange }: TemplateManagementProps) {
  const { toast } = useToast();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);
  const [templates, setTemplates] = useState<QualityFormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load templates when component mounts or socket connection changes
  useEffect(() => {
    if (socket && open) {
      setIsLoading(true);
      socket.emit('quality:template:list', (response: { templates: QualityFormTemplate[] }) => {
        setTemplates(response.templates || []);
        setIsLoading(false);
      });

      // Listen for template updates
      socket.on('quality:template:updated', (updatedTemplates: QualityFormTemplate[]) => {
        setTemplates(updatedTemplates);
      });

      return () => {
        socket.off('quality:template:updated');
      };
    }
  }, [socket, open]);

  const handleExportTemplate = (template: QualityFormTemplate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `template_${template.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleTemplateCreated = () => {
    if (socket) {
      socket.emit('quality:template:list', (response: { templates: QualityFormTemplate[] }) => {
        setTemplates(response.templates || []);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Quality Inspection Templates</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <FontAwesomeIcon icon="upload" className="mr-2 h-4 w-4" />
                Import Template
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading templates...
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No templates found. Create your first template to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="capitalize">{template.inspectionType?.replace('-', ' ')}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>{template.isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowEditDialog(true);
                            }}
                          >
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportTemplate(template)}
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
            onSuccess={handleTemplateCreated}
          />
        )}

        {showEditDialog && selectedTemplate && (
          <EditTemplateDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            template={selectedTemplate}
          />
        )}

        {showImportDialog && (
          <ImportTemplateDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}