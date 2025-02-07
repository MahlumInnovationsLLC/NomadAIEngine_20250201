import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { auditTemplates } from "@/templates/qualityTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateAuditDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateAuditDialogProps) {
  const [auditData, setAuditData] = useState({
    auditNumber: `AUDIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    type: "",
    standard: "",
    templateId: "",
    scope: "",
    department: "",
    leadAuditor: "",
    auditTeam: [],
    scheduledDate: new Date(),
    duration: 8, // Default to 8 hours
    objectives: "",
    methodology: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...auditData,
      status: 'planned',
      auditPlan: {
        objectives: auditData.objectives.split('\n'),
        methodology: auditData.methodology,
        resources: [],
        schedule: []
      }
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = auditTemplates.find(t => t.id === templateId);
    if (template) {
      setAuditData(prev => ({
        ...prev,
        templateId,
        type: template.type,
        standard: template.standard,
        methodology: `Following ${template.standard} requirements and guidelines`
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Schedule New Audit</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <form id="audit-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audit Number</Label>
                <Input
                  value={auditData.auditNumber}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  value={auditData.templateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Audit Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={auditData.type}
                  onValueChange={(value) => setAuditData({ ...auditData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Audit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Standard</Label>
                <Input
                  placeholder="e.g., ISO 9001:2015"
                  value={auditData.standard}
                  onChange={(e) => setAuditData({ ...auditData, standard: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  placeholder="Department to be audited"
                  value={auditData.department}
                  onChange={(e) => setAuditData({ ...auditData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lead Auditor</Label>
                <Input
                  placeholder="Lead Auditor Name"
                  value={auditData.leadAuditor}
                  onChange={(e) => setAuditData({ ...auditData, leadAuditor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <DatePicker
                  selected={auditData.scheduledDate}
                  onSelect={(date) => date && setAuditData({ ...auditData, scheduledDate: date })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="72"
                  value={auditData.duration}
                  onChange={(e) => setAuditData({ ...auditData, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Textarea
                placeholder="Define the scope of the audit"
                value={auditData.scope}
                onChange={(e) => setAuditData({ ...auditData, scope: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Objectives</Label>
              <Textarea
                placeholder="Enter audit objectives (one per line)"
                value={auditData.objectives}
                onChange={(e) => setAuditData({ ...auditData, objectives: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Methodology</Label>
              <Textarea
                placeholder="Describe the audit methodology"
                value={auditData.methodology}
                onChange={(e) => setAuditData({ ...auditData, methodology: e.target.value })}
                rows={3}
              />
            </div>
          </form>
        </ScrollArea>
        <div className="p-6 pt-4 border-t">
          <Button type="submit" form="audit-form" className="w-full">Schedule Audit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}