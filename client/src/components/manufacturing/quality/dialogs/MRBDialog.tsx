import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MRB, MRBSchema } from "@/types/manufacturing/mrb";
import { useQuery } from "@tanstack/react-query";

interface MRBDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: MRB;
  onSuccess: (savedMRB: MRB) => void;
}

interface PendingNCR {
  id: string;
  number: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  area: string;
  status: string;
  assignedToMrb: {
    id: string;
    number: string;
    status: string;
  } | null;
}

export function MRBDialog({ open, onOpenChange, initialData, onSuccess }: MRBDialogProps) {
  const [selectedNCRs, setSelectedNCRs] = useState<{[key: string]: { ncr: PendingNCR, notes: string }}>({});
  const isEditing = !!initialData;

  const { data: pendingNCRs = [], isLoading } = useQuery<PendingNCR[]>({
    queryKey: ['/api/manufacturing/quality/ncrs', { status: 'pending_disposition' }],
    enabled: !isEditing,
  });

  const form = useForm<MRB>({
    resolver: zodResolver(MRBSchema),
    defaultValues: initialData || {
      id: crypto.randomUUID(),
      number: `MRB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      title: "",
      description: "",
      type: "material",
      severity: "minor",
      status: "pending_review",
      partNumber: "",
      quantity: 0,
      unit: "pcs",
      location: "",
      disposition: {
        decision: "use_as_is",
        justification: "",
        approvedBy: [],
      },
      attachments: [],
      history: [],
      createdBy: "current-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedNCRs: []
    },
  });

  const toggleNCRSelection = (ncr: PendingNCR) => {
    if (ncr.assignedToMrb) return; 

    setSelectedNCRs(prev => {
      const newSelection = { ...prev };
      if (newSelection[ncr.id]) {
        delete newSelection[ncr.id];
      } else {
        newSelection[ncr.id] = { ncr, notes: '' };
      }
      return newSelection;
    });
  };

  const updateNCRNotes = (ncrId: string, notes: string) => {
    setSelectedNCRs(prev => ({
      ...prev,
      [ncrId]: { ...prev[ncrId], notes }
    }));
  };

  const onSubmit = async (data: MRB) => {
    try {
      const submitData = {
        ...data,
        linkedNCRs: Object.entries(selectedNCRs).map(([id, { notes }]) => ({
          ncrId: id,
          dispositionNotes: notes
        }))
      };

      const url = isEditing
        ? `/api/manufacturing/quality/mrb/${data.id}`
        : '/api/manufacturing/quality/mrb';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to save MRB');
      }

      const savedMRB = await response.json();
      onSuccess(savedMRB);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving MRB:', error);
    }
  };

  if (isEditing) {
    return null; // Don't render anything when editing, this will be handled by a separate component
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Material Review Board</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1">
            <ScrollArea className="flex-1 px-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <p>Loading NCRs...</p>
                </div>
              ) : pendingNCRs.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <p>No pending NCRs found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingNCRs.map((ncr) => (
                    <Card 
                      key={ncr.id} 
                      className={`border-2 relative ${
                        ncr.assignedToMrb 
                          ? 'opacity-50 cursor-not-allowed border-muted' 
                          : selectedNCRs[ncr.id]
                            ? 'border-primary'
                            : 'border-border hover:border-border/80'
                      }`}
                    >
                      {ncr.assignedToMrb && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                          <div className="transform -rotate-45 text-gray-400 text-xl font-bold whitespace-nowrap px-6 py-3 bg-background/90 shadow-sm border rounded">
                            Already in MRB {ncr.assignedToMrb.number}
                          </div>
                        </div>
                      )}
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={!!selectedNCRs[ncr.id]}
                              onCheckedChange={() => toggleNCRSelection(ncr)}
                              disabled={!!ncr.assignedToMrb}
                              className={ncr.assignedToMrb ? 'cursor-not-allowed' : ''}
                            />
                            <div className={ncr.assignedToMrb ? 'pointer-events-none' : ''}>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{ncr.title}</h4>
                                <Badge>{ncr.number}</Badge>
                                <Badge variant={ncr.severity === 'critical' ? 'destructive' : 'secondary'}>
                                  {ncr.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{ncr.description}</p>
                              <p className="text-sm text-muted-foreground mt-1">Area: {ncr.area}</p>
                            </div>
                          </div>
                        </div>
                        {selectedNCRs[ncr.id] && (
                          <div className="mt-4">
                            <FormItem>
                              <FormLabel>Initial Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  value={selectedNCRs[ncr.id].notes}
                                  onChange={(e) => updateNCRNotes(ncr.id, e.target.value)}
                                  placeholder="Add any initial notes for this NCR..."
                                />
                              </FormControl>
                            </FormItem>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={Object.keys(selectedNCRs).length === 0}
              >
                Create MRB
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}