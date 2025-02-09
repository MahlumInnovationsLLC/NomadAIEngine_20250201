import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import type {
  ProductionSectionId,
  WorkloadCenter,
  SectionAllocation,
  BOMComponentWithTraceability,
} from "@/types/manufacturing";

interface ProductionSectionManagerProps {
  projectId: string;
}

export function ProductionSectionManager({ projectId }: ProductionSectionManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState<ProductionSectionId | null>(null);
  const [showInstallationDialog, setShowInstallationDialog] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const { data: sections = [] } = useQuery<SectionAllocation[]>({
    queryKey: ['/api/manufacturing/sections', projectId],
    queryFn: () => fetch(`/api/manufacturing/sections/${projectId}`).then(res => res.json()),
  });

  const { data: workloadCenters = [] } = useQuery<WorkloadCenter[]>({
    queryKey: ['/api/manufacturing/workload-centers'],
    queryFn: () => fetch('/api/manufacturing/workload-centers').then(res => res.json()),
  });

  const installComponentMutation = useMutation({
    mutationFn: async (data: {
      sectionId: ProductionSectionId;
      componentId: string;
      installedBy: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/manufacturing/sections/${projectId}/install-component`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to record component installation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/sections', projectId] });
      toast({ title: "Success", description: "Component installation recorded successfully" });
      setShowInstallationDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function InstallationDialog() {
    const form = useForm({
      defaultValues: {
        installedBy: '',
        notes: '',
      },
    });

    const onSubmit = async (data: any) => {
      if (!selectedSection || !selectedComponent) return;
      try {
        await installComponentMutation.mutateAsync({
          sectionId: selectedSection,
          componentId: selectedComponent,
          ...data,
        });
      } catch (error) {
        console.error('Failed to record installation:', error);
      }
    };

    return (
      <Dialog open={showInstallationDialog} onOpenChange={setShowInstallationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Component Installation</DialogTitle>
            <DialogDescription>
              Record the installation details for the selected component.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Installed By"
                  {...form.register('installedBy', { required: true })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Installation Notes"
                  {...form.register('notes')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Record Installation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Production Sections Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {workloadCenters.map((center) => (
              <Card key={center.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedSection(center.sectionId)}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Section {center.sectionId}</CardTitle>
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
                    <div className="flex justify-between text-sm">
                      <span>Efficiency: {center.metrics.efficiency}%</span>
                      <span>Quality: {center.metrics.quality}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedSection && (
            <Card>
              <CardHeader>
                <CardTitle>Section {selectedSection} Components</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Installed By</TableHead>
                      <TableHead>Installation Date</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections
                      .find(s => s.sectionId === selectedSection)
                      ?.components.map((component) => (
                        <TableRow key={component.componentId}>
                          <TableCell>{component.componentId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              component.installationStatus === 'installed' ? 'bg-green-500/10 text-green-500' :
                              component.installationStatus === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500' :
                              component.installationStatus === 'verified' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-gray-500/10 text-gray-500'
                            }>
                              {component.installationStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{component.installedBy || '-'}</TableCell>
                          <TableCell>
                            {component.installationDate
                              ? new Date(component.installationDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>{component.verifiedBy || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedComponent(component.componentId);
                                setShowInstallationDialog(true);
                              }}
                              disabled={component.installationStatus === 'verified'}
                            >
                              Record Installation
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <InstallationDialog />
    </div>
  );
}
