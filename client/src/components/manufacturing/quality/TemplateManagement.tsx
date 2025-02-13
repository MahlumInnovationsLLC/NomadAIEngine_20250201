import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { QualityFormTemplate, InspectionTemplateType } from "@/types/manufacturing";
import { CreateTemplateDialog } from "./dialogs/CreateTemplateDialog";
import { EditTemplateDialog } from "./dialogs/EditTemplateDialog";
import { ImportTemplateDialog } from "./dialogs/ImportTemplateDialog";

export default function TemplateManagement() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);

  const handleExportTemplate = (template: QualityFormTemplate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `template_${template.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quality Inspection Templates</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
              Import Template
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </div>
      </CardHeader>
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
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.inspectionType}</TableCell>
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
                      <FontAwesomeIcon icon="file-export" className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {showCreateDialog && (
        <CreateTemplateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
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
    </Card>
  );
}
