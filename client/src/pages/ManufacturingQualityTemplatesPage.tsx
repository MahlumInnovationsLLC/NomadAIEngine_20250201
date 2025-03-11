import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TemplateManager } from "@/components/manufacturing/quality/templates/TemplateManager";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InspectionTemplate } from "@/types/manufacturing/templates";
import { FileText, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ManufacturingQualityTemplatesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // In a real app, this would fetch templates from an API
  // For demo, we're using the default templates in TemplateManager
  
  const handleSaveTemplate = async (template: InspectionTemplate) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // For now, just simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update templates state
      setTemplates(prevTemplates => {
        const idx = prevTemplates.findIndex(t => t.id === template.id);
        if (idx >= 0) {
          const newTemplates = [...prevTemplates];
          newTemplates[idx] = template;
          return newTemplates;
        }
        return [...prevTemplates, template];
      });
      
      // Invalidate queries that depend on template data
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      
      toast({
        title: "Template Saved",
        description: `Template '${template.name}' has been saved successfully.`,
        variant: "success"
      });
      
      return template;
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save the template. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For demo, just simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      
      toast({
        title: "Templates Refreshed",
        description: "The template list has been refreshed.",
      });
    } catch (error) {
      console.error("Error refreshing templates:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Quality Inspection Templates"
        description="Create, edit, and manage ISO 9001 compliant inspection templates for manufacturing processes"
      >
        <Button variant="outline" disabled={isLoading} onClick={handleRefresh}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button disabled={isLoading}>
          <FileText className="mr-2 h-4 w-4" />
          Documentation
        </Button>
      </PageHeader>
      
      <TemplateManager 
        onSaveTemplate={handleSaveTemplate}
        initialTemplates={templates}
      />
    </div>
  );
}