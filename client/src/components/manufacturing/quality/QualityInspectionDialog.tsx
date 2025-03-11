import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ClipboardList, FileText, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { InspectionTemplate } from "@/types/manufacturing/templates";
import TemplateManager from './templates/TemplateManager';

interface QualityInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLineId?: string;
  projectId?: string;
}

export default function QualityInspectionDialog({
  open,
  onOpenChange,
  productionLineId,
  projectId
}: QualityInspectionDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("available-templates");
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);

  // Fetch templates for selection
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/manufacturing/quality/templates'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/quality/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
    enabled: open && activeTab === 'available-templates'
  });

  // Handler for starting a new inspection
  const handleStartInspection = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    
    // In a real implementation, this would create a new inspection instance
    // and redirect to the inspection form
    toast({
      title: "Inspection Started",
      description: `Started ${template.name} inspection`,
    });
    
    // Close dialog after starting inspection
    onOpenChange(false);
  };

  // Function to filter active templates
  const activeTemplates = templates.filter((template: InspectionTemplate) => template.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Quality Inspections</DialogTitle>
          <DialogDescription>
            Start a new quality inspection or manage inspection templates
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="available-templates">Available Templates</TabsTrigger>
            <TabsTrigger value="recent-inspections">Recent Inspections</TabsTrigger>
            <TabsTrigger value="manage-templates">Manage Templates</TabsTrigger>
          </TabsList>
          
          {/* Available Templates Tab */}
          <TabsContent value="available-templates">
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {isLoading ? (
                  <div className="col-span-2 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading templates...</p>
                  </div>
                ) : activeTemplates.length > 0 ? (
                  activeTemplates.map((template: InspectionTemplate) => (
                    <div 
                      key={template.id} 
                      className="border rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        {selectedTemplate?.id === template.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {template.description?.substring(0, 120)}
                        {template.description && template.description.length > 120 ? "..." : ""}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <div className="bg-muted px-2 py-1 rounded text-xs">
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                        </div>
                        <div className="bg-muted px-2 py-1 rounded text-xs">
                          {template.sections.length} Sections
                        </div>
                        <div className="bg-muted px-2 py-1 rounded text-xs">
                          v{template.version}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center border border-dashed rounded-lg">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No active templates found
                    </p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setActiveTab("manage-templates")}
                    >
                      Manage templates
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                disabled={!selectedTemplate} 
                onClick={() => selectedTemplate && handleStartInspection(selectedTemplate)}
              >
                Start Inspection
              </Button>
            </DialogFooter>
          </TabsContent>
          
          {/* Recent Inspections Tab */}
          <TabsContent value="recent-inspections">
            <ScrollArea className="h-[60vh]">
              <div className="border border-dashed rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Recent inspections will be displayed here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This feature is under development
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Manage Templates Tab */}
          <TabsContent value="manage-templates">
            <ScrollArea className="h-[60vh]">
              <TemplateManager onStartInspection={handleStartInspection} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}