import React, { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { InspectionForm } from '../components/manufacturing/quality/inspections';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { InspectionInstance } from '@/types/manufacturing/templates';

export default function ManufacturingQualityInspectionPage() {
  useDocumentTitle('Quality Inspection');
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/manufacturing/quality-inspection/:templateId');
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Optional query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const projectId = searchParams.get('projectId') || undefined;
  const productionLineId = searchParams.get('productionLineId') || undefined;
  const batchNumber = searchParams.get('batchNumber') || undefined;
  const serialNumber = searchParams.get('serialNumber') || undefined;
  
  const templateId = params?.templateId;
  
  // Fetch the template based on ID
  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/manufacturing/quality/templates/${templateId}`],
    queryFn: async () => {
      if (!templateId) return null;
      
      const response = await fetch(`/api/manufacturing/quality/templates/${templateId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch template');
      }
      return response.json();
    },
    enabled: !!templateId,
  });
  
  // Navigate back to the templates page if the template ID is invalid
  useEffect(() => {
    if (!match && !isLoading) {
      navigate('/manufacturing/quality-templates');
    }
  }, [match, isLoading, navigate]);
  
  // Handle completion of the inspection
  const handleInspectionComplete = (inspection: InspectionInstance) => {
    setIsCompleted(true);
    // In a real implementation, we would store the inspection result
    console.log('Inspection completed:', inspection);
  };
  
  // Handle cancellation
  const handleCancel = () => {
    navigate('/manufacturing/quality-templates');
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading template...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !template) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Template</h2>
              <p className="text-muted-foreground mb-4">
                The requested inspection template could not be found or loaded.
              </p>
              <Button asChild>
                <Link to="/manufacturing/quality-templates">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Templates
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Completion state
  if (isCompleted) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-green-600 mb-2">Inspection Completed</h2>
              <p className="text-muted-foreground mb-4">
                The inspection has been successfully submitted.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" asChild>
                  <Link to="/manufacturing/quality-templates">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Templates
                  </Link>
                </Button>
                {/* Future enhancement: View inspection report button */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render the inspection form
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/manufacturing/quality-templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
      </div>
      
      <InspectionForm
        template={template}
        projectId={projectId}
        productionLineId={productionLineId}
        batchNumber={batchNumber}
        serialNumber={serialNumber}
        onComplete={handleInspectionComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}