import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TemplateList } from './TemplateList';
import { TemplateForm } from './TemplateForm';
import { TemplatePreview } from './TemplatePreview';
import { InspectionTemplate } from '../../../../types/manufacturing/templates';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

export function TemplateManager() {
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [currentTemplate, setCurrentTemplate] = useState<InspectionTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: InspectionTemplate) => {
      const response = await fetch('/api/manufacturing/quality/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Template Created',
        description: 'The template has been created successfully.',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
      setMode('list');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating Template',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: InspectionTemplate) => {
      const response = await fetch(`/api/manufacturing/quality/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Template Updated',
        description: 'The template has been updated successfully.',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
      setMode('list');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Template',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/manufacturing/quality/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Template Deleted',
        description: 'The template has been deleted successfully.',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Deleting Template',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: InspectionTemplate) => {
      // Create a new template based on the existing one
      const newTemplate = {
        ...template,
        id: undefined, // Let server generate a new ID
        name: `${template.name} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      const response = await fetch('/api/manufacturing/quality/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      
      if (!response.ok) {
        throw new Error('Failed to duplicate template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Template Duplicated',
        description: 'The template has been duplicated successfully.',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Duplicating Template',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Event handlers
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setMode('create');
  };

  const handleEditTemplate = (template: InspectionTemplate) => {
    setCurrentTemplate(template);
    setMode('edit');
  };

  const handleViewTemplate = (template: InspectionTemplate) => {
    setCurrentTemplate(template);
    setMode('view');
  };

  const handleDuplicateTemplate = (template: InspectionTemplate) => {
    duplicateTemplateMutation.mutate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteTemplateMutation.mutate(templateToDelete);
    }
  };

  const handleCancelForm = () => {
    setMode('list');
    setCurrentTemplate(null);
  };

  const handleSubmitForm = (template: InspectionTemplate) => {
    if (mode === 'create') {
      createTemplateMutation.mutate(template);
    } else if (mode === 'edit' && currentTemplate) {
      updateTemplateMutation.mutate({
        ...template,
        id: currentTemplate.id
      });
    }
  };

  // Render content based on mode
  const renderContent = () => {
    switch (mode) {
      case 'create':
      case 'edit':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {mode === 'create' ? 'Create New Template' : 'Edit Template'}
              </h2>
              <Button variant="outline" onClick={handleCancelForm}>
                Cancel
              </Button>
            </div>
            <TemplateForm
              initialValues={currentTemplate || undefined}
              onSubmit={handleSubmitForm}
              onCancel={handleCancelForm}
            />
          </div>
        );
      
      case 'view':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Template Details</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => currentTemplate && handleEditTemplate(currentTemplate)}
                >
                  Edit Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelForm}
                >
                  Back to List
                </Button>
              </div>
            </div>
            {currentTemplate && <TemplatePreview template={currentTemplate} />}
          </div>
        );
      
      case 'list':
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inspection Templates</h2>
              <Button onClick={handleCreateTemplate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
            <TemplateList
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
              onViewTemplate={handleViewTemplate}
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-6">
      {renderContent()}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Template Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTemplate}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}