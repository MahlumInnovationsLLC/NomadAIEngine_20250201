import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QualityInspection, NonConformanceReport } from "@/types/manufacturing";
import { NCRDialog } from "./NCRDialog";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [currentInspection, setCurrentInspection] = useState<QualityInspection>(inspection);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [newDefect, setNewDefect] = useState({ description: "", severity: "minor" });

  const handleFieldUpdate = (itemId: string, measurement: string | number) => {
    setCurrentInspection(prev => ({
      ...prev,
      results: {
        ...prev.results,
        checklistItems: prev.results.checklistItems.map(item => 
          item.id === itemId ? { ...item, measurement, status: measurement ? "pass" : "fail" } : item
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
      status: "identified",
      timestamp: new Date().toISOString()
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

  const handleCreateNCR = async () => {
    setShowNCRDialog(true);
  };

  const handleNCRCreated = () => {
    // Invalidate the NCR query to refresh the NCR list
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
    setShowNCRDialog(false);
    toast({
      title: "Success",
      description: "NCR created successfully from inspection findings",
    });
  };

  const handleSave = () => {
    try {
      // Calculate overall status based on defects and checklist items
      const hasDefects = currentInspection.results.defectsFound.length > 0;
      const allItemsComplete = currentInspection.results.checklistItems.every(
        item => item.status === "pass" || item.status === "fail"
      );
      const hasFailures = currentInspection.results.checklistItems.some(
        item => item.status === "fail"
      );

      const newStatus = hasDefects || hasFailures ? "failed" : 
                       allItemsComplete ? "completed" : 
                       "in_progress";

      const updatedInspection = {
        ...currentInspection,
        updatedAt: new Date().toISOString(),
        status: newStatus
      };

      onUpdate(updatedInspection);
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
              <span>Type: {inspection.templateType}</span>
              <span>•</span>
              <Badge>{inspection.status}</Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Inspection Fields */}
              {currentInspection.results.checklistItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <label className="text-sm font-medium">{item.label}</label>
                  {item.type === "number" && (
                    <Input
                      type="number"
                      value={item.measurement || ""}
                      onChange={(e) => handleFieldUpdate(item.id, e.target.value)}
                    />
                  )}
                  {item.type === "text" && (
                    <Input
                      type="text"
                      value={item.measurement || ""}
                      onChange={(e) => handleFieldUpdate(item.id, e.target.value)}
                    />
                  )}
                  {item.type === "select" && (
                    <Select
                      value={item.measurement?.toString() || ""}
                      onValueChange={(value) => handleFieldUpdate(item.id, value)}
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
                  <Badge variant={item.status === "completed" ? "default" : "secondary"} className="mt-1">
                    {item.status}
                  </Badge>
                </div>
              ))}

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
                    onClick={handleCreateNCR}
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
          onSuccess={handleNCRCreated}
        />
      )}
    </>
  );
}