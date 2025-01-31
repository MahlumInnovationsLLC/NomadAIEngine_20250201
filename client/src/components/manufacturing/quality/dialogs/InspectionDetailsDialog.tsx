import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QualityInspection } from "@/types/manufacturing";

interface InspectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: QualityInspection;
  onUpdate: (inspection: QualityInspection) => void;
}

export function InspectionDetailsDialog({ 
  open, 
  onOpenChange, 
  inspection,
  onUpdate 
}: InspectionDetailsDialogProps) {
  const { toast } = useToast();
  const [currentInspection, setCurrentInspection] = useState<QualityInspection>(inspection);

  const handleFieldUpdate = (fieldId: string, value: any) => {
    setCurrentInspection(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === fieldId ? { ...item, value, status: "completed" } : item
      )
    }));
  };

  const handleSave = () => {
    try {
      // Update inspection data
      const updatedInspection = {
        ...currentInspection,
        updatedAt: new Date().toISOString(),
        status: currentInspection.checklist.every(item => item.status === "completed") 
          ? "completed" 
          : "in-progress"
      };
      
      onUpdate(updatedInspection);
      toast({
        title: "Success",
        description: "Inspection details have been updated.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inspection details.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inspection Details</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>ID: {inspection.id}</span>
            <span>•</span>
            <span>Template: {inspection.templateName}</span>
            <span>•</span>
            <Badge>{inspection.status}</Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {currentInspection.checklist.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                {field.type === "number" && (
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                  />
                )}
                {field.type === "text" && (
                  <Input
                    type="text"
                    value={field.value || ""}
                    onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                  />
                )}
                {field.type === "select" && (
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => handleFieldUpdate(field.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Badge variant={field.status === "completed" ? "default" : "secondary"} className="mt-1">
                  {field.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
