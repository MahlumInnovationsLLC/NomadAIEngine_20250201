import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QualityInspection } from "@/types/manufacturing";
import { NCRDialog } from "./NCRDialog";

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
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [newDefect, setNewDefect] = useState({ description: "", severity: "minor" });

  const handleFieldUpdate = (itemId: string, value: string | number) => {
    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        checklistItems: prev.results.checklistItems.map(item =>
          item.id === itemId ? {
            ...item,
            measurement: value,
            status: value === "pass" || value === "fail" || value === "na" ? value : item.status
          } : item
        )
      }
    }));
  };

  const handleAddDefect = () => {
    if (!newDefect.description) return;

    const defectItem = {
      id: `DEF-${Date.now()}`,
      description: newDefect.description,
      severity: newDefect.severity as "minor" | "major" | "critical",
      status: "identified"
    };

    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        defectsFound: [...prev.results.defectsFound, defectItem]
      }
    }));

    setNewDefect({ description: "", severity: "minor" });
  };

  const handleRemoveDefect = (defectId: string) => {
    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        defectsFound: prev.results.defectsFound.filter(d => d.id !== defectId)
      }
    }));
  };

  const handleSave = async () => {
    try {
      const hasDefects = currentInspection.results.defectsFound.length > 0;
      const isComplete = currentInspection.results.checklistItems.every(item =>
        item.status === "pass" || item.status === "fail" || item.status === "na"
      );

      const updatedInspection = {
        ...currentInspection,
        status: hasDefects ? "failed" : isComplete ? "completed" : "in_progress",
        updatedAt: new Date().toISOString()
      };

      await onUpdate(updatedInspection);
      toast({
        title: "Success",
        description: "Inspection details have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inspection details.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ID: {inspection.id}</span>
              <span>•</span>
              <span>Template: {inspection.templateType}</span>
              <span>•</span>
              <Badge>{inspection.status}</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Inspection Checklist</h4>
                {currentInspection.results.checklistItems.map((item) => (
                  <div key={item.id} className="space-y-4 mb-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">{item.parameter}</label>
                      <span className="text-xs text-muted-foreground">{item.specification}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          type={typeof item.measurement === 'number' ? 'number' : 'text'}
                          placeholder="Enter measurement"
                          value={item.measurement || ""}
                          onChange={(e) => handleFieldUpdate(item.id, 
                            typeof item.measurement === 'number' ? 
                            parseFloat(e.target.value) : e.target.value
                          )}
                        />
                      </div>
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleFieldUpdate(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                          <SelectItem value="na">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant={
                      item.status === "pass" ? "default" :
                      item.status === "fail" ? "destructive" :
                      "secondary"
                    }>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Defects Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Defects Found</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter defect description"
                    value={newDefect.description}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Select
                    value={newDefect.severity}
                    onValueChange={(value) => setNewDefect(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddDefect}>Add Defect</Button>
                </div>

                {/* Defects List */}
                <div className="space-y-2">
                  {currentInspection.results.defectsFound.map((defect) => (
                    <div key={defect.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          defect.severity === "critical" ? "destructive" :
                          defect.severity === "major" ? "default" : "secondary"
                        }>
                          {defect.severity}
                        </Badge>
                        <span>{defect.description}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDefect(defect.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {currentInspection.results.defectsFound.length > 0 && (
                  <Button 
                    variant="destructive"
                    onClick={() => setShowNCRDialog(true)}
                    className="w-full"
                  >
                    Create NCR for Defects
                  </Button>
                )}
              </div>
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

      {showNCRDialog && (
        <NCRDialog
          open={showNCRDialog}
          onOpenChange={setShowNCRDialog}
          inspection={currentInspection}
          defaultValues={{
            title: `NCR: ${currentInspection.templateType} Inspection - ${currentInspection.productionLineId}`,
            description: currentInspection.results.defectsFound.map(d => 
              `${d.severity.toUpperCase()}: ${d.description}`
            ).join('\n'),
            type: "product",
            severity: currentInspection.results.defectsFound.some(d => d.severity === "critical") ? "critical" :
                     currentInspection.results.defectsFound.some(d => d.severity === "major") ? "major" : "minor",
            area: currentInspection.productionLineId,
            productLine: currentInspection.productionLineId,
            disposition: "pending",
          }}
        />
      )}
    </>
  );
}