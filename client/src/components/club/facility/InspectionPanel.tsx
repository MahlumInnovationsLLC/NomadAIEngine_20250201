import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Inspection } from "@/types/facility";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface InspectionPanelProps {
  inspections: Inspection[];
}

export default function InspectionPanel({ inspections }: InspectionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const getStatusIcon = (status: Inspection['status']) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in-progress':
        return 'clock';
      case 'overdue':
        return 'alert-triangle';
      default:
        return 'calendar';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Facility Inspections</h3>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Schedule Inspection
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inspections.map((inspection) => (
          <Card key={inspection.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {inspection.type.charAt(0).toUpperCase() + inspection.type.slice(1)} Inspection
              </CardTitle>
              <FontAwesomeIcon
                icon={getStatusIcon(inspection.status)}
                className={`h-4 w-4 ${getStatusColor(inspection.status)}`}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={getStatusColor(inspection.status)}>
                    {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Area:</span>
                  <span>{inspection.area}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{new Date(inspection.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assigned To:</span>
                  <span>{inspection.assignedTo}</span>
                </div>
                {inspection.checklist && inspection.checklist.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground">Checklist Progress:</span>
                    <div className="mt-2">
                      <div className="h-2 bg-secondary rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(inspection.checklist.filter(item => item.status !== 'na').length /
                              inspection.checklist.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
