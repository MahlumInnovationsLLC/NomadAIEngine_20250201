import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { InspectionTemplate } from '@/types/manufacturing/templates';
import { TemplateList } from './TemplateList';
import { TemplateForm } from './TemplateForm';
import { TemplatePreview } from './TemplatePreview';
import { 
  createNewTemplate, 
  duplicateTemplate, 
  toggleTemplateArchiveStatus,
  validateTemplate 
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, FileWarning } from 'lucide-react';

interface TemplateManagerProps {
  initialTemplates?: InspectionTemplate[];
  onSaveTemplate?: (template: InspectionTemplate) => Promise<any>;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
  loading?: boolean;
  onStartInspection?: (template: InspectionTemplate) => void;
}

export enum TemplateManagerView {
  List = 'list',
  Preview = 'preview',
  Edit = 'edit',
  Create = 'create'
}

export function TemplateManager({
  initialTemplates = [],
  onSaveTemplate,
  onDeleteTemplate,
  onStartInspection,
  loading = false
}: TemplateManagerProps) {
  // State for templates and UI
  const [templates, setTemplates] = useState<InspectionTemplate[]>(initialTemplates);
  const [currentView, setCurrentView] = useState<TemplateManagerView>(TemplateManagerView.List);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Update templates when initialTemplates changes
  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);
  
  // Create a new template
  const handleCreateTemplate = () => {
    const newTemplate = createNewTemplate();
    setSelectedTemplate(newTemplate);
    setCurrentView(TemplateManagerView.Create);
    setValidationErrors([]);
    setShowValidationAlert(false);
  };
  
  // Select a template to view
  const handleSelectTemplate = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setCurrentView(TemplateManagerView.Preview);
  };
  
  // Edit an existing template
  const handleEditTemplate = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setCurrentView(TemplateManagerView.Edit);
    setValidationErrors([]);
    setShowValidationAlert(false);
  };
  
  // Duplicate a template
  const handleDuplicateTemplate = (template: InspectionTemplate) => {
    const duplicated = duplicateTemplate(template);
    
    // If we have a server-side save function
    if (onSaveTemplate) {
      setIsSubmitting(true);
      onSaveTemplate(duplicated)
        .then(() => {
          setTemplates(prev => [...prev, duplicated]);
          toast({
            title: 'Template duplicated',
            description: `"${template.name}" has been duplicated successfully.`
          });
        })
        .catch(error => {
          toast({
            title: 'Duplication failed',
            description: `Failed to duplicate template: ${error.message}`,
            variant: 'destructive'
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      // Client-side only
      setTemplates(prev => [...prev, duplicated]);
      toast({
        title: 'Template duplicated',
        description: `"${template.name}" has been duplicated successfully.`
      });
    }
  };
  
  // Toggle archive status
  const handleToggleArchive = (template: InspectionTemplate) => {
    const updated = toggleTemplateArchiveStatus(template);
    
    // If we have a server-side save function
    if (onSaveTemplate) {
      setIsSubmitting(true);
      onSaveTemplate(updated)
        .then(() => {
          setTemplates(prev => 
            prev.map(t => t.id === updated.id ? updated : t)
          );
          toast({
            title: updated.isArchived ? 'Template archived' : 'Template restored',
            description: `"${template.name}" has been ${updated.isArchived ? 'archived' : 'restored'} successfully.`
          });
        })
        .catch(error => {
          toast({
            title: 'Action failed',
            description: `Failed to update template: ${error.message}`,
            variant: 'destructive'
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      // Client-side only
      setTemplates(prev => 
        prev.map(t => t.id === updated.id ? updated : t)
      );
      toast({
        title: updated.isArchived ? 'Template archived' : 'Template restored',
        description: `"${template.name}" has been ${updated.isArchived ? 'archived' : 'restored'} successfully.`
      });
    }
    
    // If the archived template is currently selected, go back to list view
    if (selectedTemplate?.id === template.id) {
      setCurrentView(TemplateManagerView.List);
      setSelectedTemplate(null);
    }
  };
  
  // Handle delete
  const handleDeleteClick = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedTemplate || !onDeleteTemplate) return;
    
    setIsSubmitting(true);
    try {
      await onDeleteTemplate(selectedTemplate.id);
      
      // Remove from local state
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
      
      // Show success toast
      toast({
        title: 'Template deleted',
        description: `"${selectedTemplate.name}" has been permanently deleted.`
      });
      
      // Reset view
      setCurrentView(TemplateManagerView.List);
      setSelectedTemplate(null);
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Save template (create or update)
  const handleSaveTemplate = async (template: InspectionTemplate) => {
    // Validate the template
    const validation = validateTemplate(template);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setShowValidationAlert(true);
      toast({
        title: 'Validation failed',
        description: 'Please fix the errors before saving.',
        variant: 'destructive'
      });
      return;
    }
    
    // Clear validation errors
    setValidationErrors([]);
    setShowValidationAlert(false);
    
    // If we're in create mode, set the creation date
    let updatedTemplate = { ...template };
    if (currentView === TemplateManagerView.Create) {
      updatedTemplate.createdAt = new Date().toISOString();
    }
    
    // Always update the updated date
    updatedTemplate.updatedAt = new Date().toISOString();
    
    // If we have a server-side save function
    if (onSaveTemplate) {
      setIsSubmitting(true);
      onSaveTemplate(updatedTemplate)
        .then(() => {
          // Update templates list
          setTemplates(prev => {
            const exists = prev.find(t => t.id === updatedTemplate.id);
            return exists 
              ? prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
              : [...prev, updatedTemplate];
          });
          
          // Show success message
          toast({
            title: currentView === TemplateManagerView.Create ? 'Template created' : 'Template updated',
            description: `"${updatedTemplate.name}" has been ${currentView === TemplateManagerView.Create ? 'created' : 'updated'} successfully.`
          });
          
          // Go back to list or preview
          setSelectedTemplate(updatedTemplate);
          setCurrentView(TemplateManagerView.Preview);
        })
        .catch(error => {
          toast({
            title: 'Save failed',
            description: `Failed to save template: ${error.message}`,
            variant: 'destructive'
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      // Client-side only
      // Update templates list
      setTemplates(prev => {
        const exists = prev.find(t => t.id === updatedTemplate.id);
        return exists 
          ? prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
          : [...prev, updatedTemplate];
      });
      
      // Show success message
      toast({
        title: currentView === TemplateManagerView.Create ? 'Template created' : 'Template updated',
        description: `"${updatedTemplate.name}" has been ${currentView === TemplateManagerView.Create ? 'created' : 'updated'} successfully.`
      });
      
      // Go back to list or preview
      setSelectedTemplate(updatedTemplate);
      setCurrentView(TemplateManagerView.Preview);
    }
  };
  
  // Handle print
  const handlePrintTemplate = () => {
    // Implementation will depend on your printing requirements
    toast({
      title: 'Print requested',
      description: 'Printing functionality will be implemented soon.'
    });
  };
  
  // Handle download
  const handleDownloadTemplate = () => {
    if (!selectedTemplate) return;
    
    // Create a JSON string of the template
    const templateJson = JSON.stringify(selectedTemplate, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([templateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '_')}_v${selectedTemplate.version}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template downloaded',
      description: 'The template has been downloaded as a JSON file.'
    });
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }
  
  // Render current view based on state
  return (
    <div className="space-y-6">
      {/* Templates List View */}
      {currentView === TemplateManagerView.List && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Quality Inspection Templates</h2>
            <Button onClick={handleCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
          
          <TemplateList 
            templates={templates}
            onSelectTemplate={handleSelectTemplate}
            onEditTemplate={handleEditTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onToggleArchive={handleToggleArchive}
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </>
      )}
      
      {/* Template Preview View */}
      {currentView === TemplateManagerView.Preview && selectedTemplate && (
        <TemplatePreview 
          template={selectedTemplate}
          onBack={() => {
            setCurrentView(TemplateManagerView.List);
            setSelectedTemplate(null);
          }}
          onEdit={() => handleEditTemplate(selectedTemplate)}
          onDuplicate={() => handleDuplicateTemplate(selectedTemplate)}
          onDownload={handleDownloadTemplate}
          onPrint={handlePrintTemplate}
          onStartInspection={onStartInspection}
        />
      )}
      
      {/* Template Edit View */}
      {(currentView === TemplateManagerView.Edit || currentView === TemplateManagerView.Create) && selectedTemplate && (
        <>
          {showValidationAlert && validationErrors.length > 0 && (
            <Alert variant="destructive">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 ml-6 list-disc text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <TemplateForm 
            initialTemplate={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => {
              if (currentView === TemplateManagerView.Create) {
                setCurrentView(TemplateManagerView.List);
                setSelectedTemplate(null);
              } else {
                setCurrentView(TemplateManagerView.Preview);
              }
              setValidationErrors([]);
              setShowValidationAlert(false);
            }}
            isCreating={currentView === TemplateManagerView.Create}
          />
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template &quot;{selectedTemplate?.name}&quot;. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
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
    </div>
  );
}