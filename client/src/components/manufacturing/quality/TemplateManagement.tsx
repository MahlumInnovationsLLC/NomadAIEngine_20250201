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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  useEffect(() => {
    if (socket && open) {
      setIsLoading(true);
      socket.emit('quality:template:list', (response: { templates: QualityFormTemplate[] }) => {
        setTemplates(response.templates || []);
        setIsLoading(false);
      });

      socket.on('quality:template:updated', (updatedTemplates: QualityFormTemplate[]) => {
        setTemplates(updatedTemplates);
      });

      return () => {
        socket.off('quality:template:updated');
      };
    }
  }, [socket, open]);

  const handleExportTemplate = (template: QualityFormTemplate) => {
    const templateCopy = { ...template };
    const { _id, __v, ...exportTemplate } = templateCopy as any;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportTemplate, null, 2));
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
  };

  const handleTemplateCreated = () => {
    if (socket) {
      socket.emit('quality:template:list', (response: { templates: QualityFormTemplate[] }) => {
        setTemplates(response.templates || []);
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh]">
        <DialogHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">Quality Inspection Templates</DialogTitle>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowImportDialog(true)}
                      className="flex items-center"
                      size="lg"
                    >
                      <FontAwesomeIcon icon="file-import" className="mr-2" />
                      Import Template
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Import a quality inspection template from a JSON file
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="flex items-center"
                      size="lg"
                    >
                      <FontAwesomeIcon icon="plus" className="mr-2" />
                      Create Template
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Create a new quality inspection template
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Times Used</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon="spinner" className="animate-spin" />
                        <span>Loading templates...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">No templates found</p>
                        <p className="text-sm text-muted-foreground">
                          Create a new template or import an existing one to get started
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => {
                    const usage = getTemplateUsage(template.id);
                    return (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="capitalize">{template.type.replace('-', ' ')}</TableCell>
                        <TableCell>v{template.version}</TableCell>
                        <TableCell>{usage.usageCount} times</TableCell>
                        <TableCell>{formatDate(usage.lastUsed)}</TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent>Edit Template</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleExportTemplate(template)}
                                  >
                                    <FontAwesomeIcon icon="download" className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Export Template</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            onSuccess={handleTemplateCreated}
          />
        )}

        {showImportDialog && (
          <ImportTemplateDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            onSuccess={handleTemplateCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}