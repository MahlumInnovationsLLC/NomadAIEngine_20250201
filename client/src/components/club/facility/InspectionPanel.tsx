import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Inspection } from "@/types/facility";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface InspectionPanelProps {
  inspections: Inspection[];
}

export default function InspectionPanel({ inspections }: InspectionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewInspectionDialog, setShowNewInspectionDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const createInspectionMutation = useMutation({
    mutationFn: async (data: Partial<Inspection>) => {
      const response = await fetch('/api/facility/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create inspection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facility/inspections'] });
      setShowNewInspectionDialog(false);
      toast({
        title: 'Inspection Created',
        description: 'New inspection has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, status, checklist }: { id: string; status?: string; checklist?: any[] }) => {
      const response = await fetch(`/api/facility/inspections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, checklist }),
      });

      if (!response.ok) {
        throw new Error('Failed to update inspection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facility/inspections'] });
      toast({
        title: 'Inspection Updated',
        description: 'Inspection has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: Inspection['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in-progress':
        return 'text-blue-500';
      case 'overdue':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusBadgeVariant = (status: Inspection['status']) => {
    switch (status) {
      case 'completed':
        return 'success' as const;
      case 'in-progress':
        return 'default' as const;
      case 'overdue':
        return 'destructive' as const;
      default:
        return 'warning' as const;
    }
  };

  const handleCreateInspection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newInspection: Partial<Inspection> = {
      type: formData.get('type') as Inspection['type'],
      status: 'pending',
      assignedTo: formData.get('assignedTo') as string,
      dueDate: formData.get('dueDate') as string,
      area: formData.get('area') as string,
      checklist: [
        { item: 'Safety Equipment Check', status: 'na' },
        { item: 'Cleanliness Inspection', status: 'na' },
        { item: 'Equipment Functionality', status: 'na' },
        { item: 'Documentation Review', status: 'na' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createInspectionMutation.mutate(newInspection);
  };

  const calculateProgress = (checklist: Inspection['checklist']) => {
    const completedItems = checklist.filter(item => item.status !== 'na').length;
    return (completedItems / checklist.length) * 100;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Facility Inspections</h3>
        <Button onClick={() => setShowNewInspectionDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Schedule Inspection
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inspections.map((inspection) => (
          <Card key={inspection.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedInspection(inspection)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">
                  {inspection.type.charAt(0).toUpperCase() + inspection.type.slice(1)} Inspection
                </CardTitle>
                <p className="text-sm text-muted-foreground">{inspection.area}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(inspection.status)}>
                {inspection.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{new Date(inspection.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span>{inspection.assignedTo}</span>
                  </div>
                </div>

                {inspection.checklist && inspection.checklist.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span>{Math.round(calculateProgress(inspection.checklist))}%</span>
                    </div>
                    <Progress value={calculateProgress(inspection.checklist)} className="h-2" />
                  </div>
                )}

                {inspection.issues && inspection.issues.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium">Issues Found:</span>
                    <div className="mt-2 space-y-1">
                      {inspection.issues.map((issue, index) => (
                        <div key={index} className="text-sm flex items-center gap-2">
                          <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'warning' : 'default'}>
                            {issue.severity}
                          </Badge>
                          <span className="truncate">{issue.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Inspection Dialog */}
      <Dialog open={showNewInspectionDialog} onOpenChange={setShowNewInspectionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Inspection</DialogTitle>
            <DialogDescription>
              Create a new facility inspection task
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInspection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Inspection Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                name="area"
                placeholder="Gym Floor, Pool Area, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Input
                id="assignedTo"
                name="assignedTo"
                placeholder="Staff member name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Create Inspection
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}