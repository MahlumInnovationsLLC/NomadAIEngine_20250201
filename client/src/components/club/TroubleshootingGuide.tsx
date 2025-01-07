import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { Equipment } from "@db/schema";

interface TroubleshootingGuideProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
}

export function TroubleshootingGuide({ equipment, open, onOpenChange }: TroubleshootingGuideProps) {
  const { data: guide } = useQuery({
    queryKey: [`/api/equipment/${equipment.id}/troubleshooting`],
    enabled: open,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getHealthStatus = () => {
    if (!equipment.healthScore) return 'unknown';
    if (equipment.healthScore >= 80) return 'good';
    if (equipment.healthScore >= 60) return 'warning';
    return 'critical';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Troubleshooting Guide: {equipment.name}
          </DialogTitle>
          <DialogDescription>
            Follow these steps to diagnose and resolve common issues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Health Status */}
          <Alert variant={getHealthStatus() === 'good' ? 'default' : 'destructive'}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Current Health Status</AlertTitle>
            <AlertDescription className="mt-2">
              Health Score: {equipment.healthScore}%
              {equipment.status === 'maintenance' && (
                <div className="mt-1 text-yellow-600">
                  Maintenance Required
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Common Issues and Solutions */}
          <Accordion type="single" collapsible className="w-full">
            {guide?.steps?.map((step: TroubleshootingStep) => (
              <AccordionItem key={step.id} value={step.id}>
                <AccordionTrigger className="flex items-center gap-2">
                  <AlertCircle className={`h-4 w-4 text-${getSeverityColor(step.severity)}-500`} />
                  {step.title}
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Recommended Solution</AlertTitle>
                      <AlertDescription>
                        {step.solution}
                      </AlertDescription>
                    </Alert>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Support Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">
              Contact Support
            </Button>
            <Button>
              Schedule Maintenance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
