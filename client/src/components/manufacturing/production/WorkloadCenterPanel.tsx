import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface WorkloadCenterProps {
  projectId: string;
}

export function WorkloadCenterPanel({ projectId }: WorkloadCenterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);

  const { data: workloadCenters = [] } = useQuery({
    queryKey: ['/api/manufacturing/workload-centers'],
    queryFn: () => fetch('/api/manufacturing/workload-centers').then(res => res.json()),
  });

  const assignComponentMutation = useMutation({
    mutationFn: async (data: {
      componentId: string;
      workloadCenterId: string;
      projectId: string;
    }) => {
      const response = await fetch('/api/manufacturing/workload-centers/assign-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to assign component');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/workload-centers'] });
      toast({ title: "Success", description: "Component assigned successfully" });
      setShowScanner(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleScan = async (result: string) => {
    if (result && selectedCenter) {
      try {
        await assignComponentMutation.mutateAsync({
          componentId: result,
          workloadCenterId: selectedCenter,
          projectId,
        });
      } catch (error) {
        console.error('Failed to assign component:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Workload Centers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {workloadCenters.map((center: any) => (
            <Card key={center.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Section {center.code}</CardTitle>
                  <Badge variant="outline" className={
                    center.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    center.status === 'maintenance' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }>
                    {center.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{center.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Load: {center.currentLoad}/{center.maxCapacity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCenter(center.id);
                        setShowScanner(true);
                      }}
                    >
                      <FontAwesomeIcon icon="qrcode" className="mr-2" />
                      Scan Component
                    </Button>
                  </div>
                </div>
                {center.componentTracking.installedComponents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Installed Components</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {center.componentTracking.installedComponents.map((componentId: string) => (
                          <TableRow key={componentId}>
                            <TableCell>{componentId}</TableCell>
                            <TableCell>
                              <Badge>Installed</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Component</DialogTitle>
            <DialogDescription>
              Scan the QR code on the component to assign it to this workload center
            </DialogDescription>
          </DialogHeader>
          <div className="h-[300px]">
            <Scanner
              onDecode={handleScan}
              onError={(error: Error) => console.error(error)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
