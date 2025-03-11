import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TemplatePreview } from '@/components/manufacturing/quality/templates/TemplatePreview';
import { InspectionTemplate } from '@/types/manufacturing/templates';
import { fabricationInspectionTemplate, electricalInspectionTemplate, paintInspectionTemplate } from '@/data/sampleTemplates';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ManufacturingQualityTemplatesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([
    fabricationInspectionTemplate,
    electricalInspectionTemplate, 
    paintInspectionTemplate
  ]);

  const handleCreateTemplate = () => {
    toast({
      title: "Creation not implemented",
      description: "Template creation functionality is not yet implemented.",
      variant: "destructive"
    });
  };

  const handleTemplateClick = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
    toast({
      title: "Template Deleted",
      description: "The template has been successfully deleted.",
    });
  };

  const handleDuplicateTemplate = (template: InspectionTemplate) => {
    const newTemplate: InspectionTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now().toString(36)}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTemplates([...templates, newTemplate]);
    toast({
      title: "Template Duplicated",
      description: "A copy of the template has been created.",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Quality Inspection Templates"
        description="Manage inspection templates for quality control processes"
        actions={
          <Button onClick={() => setActiveTab('create')}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        }
      />
      
      <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="create">Create Template</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Library</CardTitle>
                  <CardDescription>
                    Select a template to view or edit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {templates.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No templates found</AlertTitle>
                      <AlertDescription>
                        Create a new template to get started.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedTemplate?.id === template.id
                            ? 'bg-accent border-primary'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleTemplateClick(template)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{template.name}</div>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {template.description?.slice(0, 60)}
                          {template.description && template.description.length > 60 ? '...' : ''}
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateTemplate(template);
                              }}
                            >
                              Duplicate
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {selectedTemplate ? (
                <TemplatePreview template={selectedTemplate} />
              ) : (
                <div className="border rounded-lg p-6 h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Select a template to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Design a new inspection template for quality control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template Creation Coming Soon</AlertTitle>
                <AlertDescription>
                  The template creation interface is currently under development.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end mt-4">
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}