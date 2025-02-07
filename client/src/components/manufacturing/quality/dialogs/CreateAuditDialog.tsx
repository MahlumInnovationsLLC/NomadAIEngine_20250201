
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

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
    title: "",
    type: "",
    date: new Date(),
    auditor: "",
    department: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(auditData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Audit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Audit Title"
            value={auditData.title}
            onChange={(e) => setAuditData({ ...auditData, title: e.target.value })}
          />
          <Select
            value={auditData.type}
            onValueChange={(value) => setAuditData({ ...auditData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Audit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iso9001">ISO 9001</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker
            date={auditData.date}
            onDateChange={(date) => setAuditData({ ...auditData, date })}
          />
          <Input
            placeholder="Auditor Name"
            value={auditData.auditor}
            onChange={(e) => setAuditData({ ...auditData, auditor: e.target.value })}
          />
          <Input
            placeholder="Department"
            value={auditData.department}
            onChange={(e) => setAuditData({ ...auditData, department: e.target.value })}
          />
          <Button type="submit" className="w-full">Create Audit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
