import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InspectionTemplate } from "@/types/manufacturing/templates";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  MoreVertical, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  ArrowDownToLine, 
  CheckCircle,
  Loader2,
  FileUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateForm } from '../templates/TemplateForm';
import { TemplatePreview } from '../templates/TemplatePreview';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ImportTemplateDialog } from './ImportTemplateDialog';

interface QualityTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

enum DialogView {
  List,
  Create,
  Edit,
  Preview
}

export default function QualityTemplatesDialog({
  open,
  onOpenChange
}: QualityTemplatesDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<DialogView>(DialogView.List);
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // Reset view when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentView(DialogView.List);
      setSelectedTemplate(null);
    }
  }, [open]);

  // Fetch templates
  const { data: templates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/manufacturing/quality/templates'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/quality/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: InspectionTemplate) => {
      const method = template.id ? 'PUT' : 'POST';
      const url = template.id 
        ? `/api/manufacturing/quality/templates/${template.id}` 
        : '/api/manufacturing/quality/templates';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
      toast({
        title: "Success",
        description: "Template saved successfully",
      });
      setCurrentView(DialogView.List);
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/manufacturing/quality/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleCreateTemplate = () => {
    const newTemplate: InspectionTemplate = {
      id: "",
      name: "New Template",
      description: "",
      version: 1,
      isActive: true,
      isArchived: false,
      category: "general",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [],
      standard: "ISO 9001"
    };
    setSelectedTemplate(newTemplate);
    setCurrentView(DialogView.Create);
  };

  const handleEditTemplate = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setCurrentView(DialogView.Edit);
  };

  const handlePreviewTemplate = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setCurrentView(DialogView.Preview);
  };

  const handleDeleteTemplate = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate?.id) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
  };

  const handleDuplicateTemplate = (template: InspectionTemplate) => {
    const duplicatedTemplate: InspectionTemplate = {
      ...template,
      id: "",
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedTemplate(duplicatedTemplate);
    setCurrentView(DialogView.Create);
  };

  const handleSaveTemplate = async (template: InspectionTemplate) => {
    // Basic validation
    const errors: string[] = [];
    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }
    if (template.sections.length === 0) {
      errors.push('Template must have at least one section');
    }
    template.sections.forEach((section, sectionIndex) => {
      if (!section.title || section.title.trim() === '') {
        errors.push(`Section ${sectionIndex + 1} must have a title`);
      }
      if (section.fields.length === 0) {
        errors.push(`Section "${section.title || sectionIndex + 1}" must have at least one field`);
      }
      section.fields.forEach((field, fieldIndex) => {
        if (!field.label || field.label.trim() === '') {
          errors.push(`Field ${fieldIndex + 1} in section "${section.title || sectionIndex + 1}" must have a label`);
        }
      });
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationAlert(true);
      return;
    }

    saveTemplateMutation.mutate(template);
  };

  const handleImportTemplate = () => {
    setImportDialogOpen(true);
  };

  const handleDownloadTemplate = (template: InspectionTemplate) => {
    const jsonString = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}_v${template.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartInspection = (template: InspectionTemplate) => {
    // This function will be implemented to start an inspection
    toast({
      title: "Inspection Started",
      description: `Started ${template.name} inspection`,
    });
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Dialog content based on current view
  const renderDialogContent = () => {
    if (currentView === DialogView.List) {
      return (
        <>
          <div className="flex justify-between items-center mb-4">
            <DialogTitle>Quality Inspections Templates</DialogTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleImportTemplate}
              >
                <FileUp className="mr-2 h-4 w-4" />
                Import Template
              </Button>
              <Button onClick={handleCreateTemplate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading additional templates...</p>
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">Error loading templates</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-2">
                Retry
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center border rounded-md border-dashed">
              <p className="text-muted-foreground">No templates found</p>
              <Button onClick={handleCreateTemplate} className="mt-2">
                Create your first template
              </Button>
            </div>
          ) : (
            <div className="relative">
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
                  {templates.map((template: InspectionTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "success" : "secondary"}>
                          {template.isActive ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadTemplate(template)}>
                              <ArrowDownToLine className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {template.isActive && (
                              <DropdownMenuItem onClick={() => handleStartInspection(template)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Start Inspection
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      );
    }

    if (currentView === DialogView.Preview && selectedTemplate) {
      return (
        <TemplatePreview 
          template={selectedTemplate}
          onBack={() => setCurrentView(DialogView.List)}
          onEdit={() => setCurrentView(DialogView.Edit)}
          onDuplicate={() => handleDuplicateTemplate(selectedTemplate)}
          onDownload={() => handleDownloadTemplate(selectedTemplate)}
          onPrint={() => console.log('Print not implemented')}
          onStartInspection={handleStartInspection}
        />
      );
    }

    if ((currentView === DialogView.Create || currentView === DialogView.Edit) && selectedTemplate) {
      return (
        <TemplateForm 
          initialTemplate={selectedTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            if (currentView === DialogView.Create) {
              setCurrentView(DialogView.List);
            } else {
              setCurrentView(DialogView.Preview);
            }
            setValidationErrors([]);
            setShowValidationAlert(false);
          }}
          isCreating={currentView === DialogView.Create}
          validationErrors={validationErrors}
          showValidationAlert={showValidationAlert}
        />
      );
    }

    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {renderDialogContent()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template &quot;{selectedTemplate?.name}&quot;. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTemplateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteTemplateMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportTemplateDialog 
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
        }}
      />
    </>
  );
}