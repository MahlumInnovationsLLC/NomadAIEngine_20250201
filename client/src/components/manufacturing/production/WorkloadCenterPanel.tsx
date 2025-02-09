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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkloadCenterProps {
  projectId: string;
}

export function WorkloadCenterPanel({ projectId }: WorkloadCenterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSignOffDialog, setShowSignOffDialog] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [componentId, setComponentId] = useState("");
  const [installerName, setInstallerName] = useState("");
  const [notes, setNotes] = useState("");

  const { data: workloadCenters = [] } = useQuery({
    queryKey: ['/api/manufacturing/workload-centers'],
    queryFn: () => fetch('/api/manufacturing/workload-centers').then(res => res.json()),
  });

  const { data: sectionComponents = {} } = useQuery({
    queryKey: ['/api/manufacturing/section-components', projectId],
    queryFn: async () => {
      const components: Record<string, any[]> = {};
      for (const center of workloadCenters) {
        const response = await fetch(`/api/manufacturing/section-components/${center.id}/${projectId}`);
        components[center.id] = await response.json();
      }
      return components;
    },
    enabled: workloadCenters.length > 0,
  });

  const assignComponentMutation = useMutation({
    mutationFn: async (data: {
      componentId: string;
      workloadCenterId: string;
      projectId: string;
      sectionOrder: number;
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
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/section-components'] });
      toast({ title: "Success", description: "Component assigned successfully" });
      setShowAddDialog(false);
      setComponentId("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const signOffInstallationMutation = useMutation({
    mutationFn: async (data: {
      installationId: string;
      installedBy: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/manufacturing/installations/sign-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to sign off installation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/section-components'] });
      toast({ title: "Success", description: "Installation signed off successfully" });
      setShowSignOffDialog(false);
      setSelectedComponent(null);
      setInstallerName("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddComponent = async () => {
    if (!componentId || !selectedCenter) return;

    const center = workloadCenters.find((c: any) => c.id === selectedCenter);
    try {
      await assignComponentMutation.mutateAsync({
        componentId,
        workloadCenterId: selectedCenter,
        projectId,
        sectionOrder: center.routingOrder,
      });
    } catch (error) {
      console.error('Failed to assign component:', error);
    }
  };

  const handleSignOff = async () => {
    if (!selectedComponent || !installerName) return;

    try {
      await signOffInstallationMutation.mutateAsync({
        installationId: selectedComponent.id,
        installedBy: installerName,
        notes,
      });
    } catch (error) {
      console.error('Failed to sign off installation:', error);
    }
  };

  // Sort centers by routing order
  const sortedCenters = [...workloadCenters].sort((a: any, b: any) => a.routingOrder - b.routingOrder);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Sections</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-2 gap-4 p-4">
            {sortedCenters.map((center: any) => (
              <Card key={center.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CardTitle>Section {center.code}</CardTitle>
                      {center.previousSection && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FontAwesomeIcon icon="arrow-left" className="text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Previous: Section {center.previousSection}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {center.nextSection && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FontAwesomeIcon icon="arrow-right" className="text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Next: Section {center.nextSection}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Load: {center.currentLoad}/{center.maxCapacity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCenter(center.id);
                          setShowAddDialog(true);
                        }}
                      >
                        <FontAwesomeIcon icon="plus" className="mr-2" />
                        Add Component
                      </Button>
                    </div>

                    {sectionComponents[center.id]?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Components</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Component ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sectionComponents[center.id].map((component: any) => (
                              <TableRow key={component.id}>
                                <TableCell className="font-mono">{component.componentId}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    component.signOffStatus === 'verified' ? 'default' :
                                    component.signOffStatus === 'installed' ? 'secondary' :
                                    'outline'
                                  }>
                                    {component.signOffStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {component.signOffStatus === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedComponent(component);
                                        setShowSignOffDialog(true);
                                      }}
                                    >
                                      Sign Off
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Component</DialogTitle>
            <DialogDescription>
              Enter the component ID to assign it to this section
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="componentId">Component ID</Label>
              <Input
                id="componentId"
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
                placeholder="Enter component ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComponent} disabled={!componentId}>
              Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSignOffDialog} onOpenChange={setShowSignOffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Off Installation</DialogTitle>
            <DialogDescription>
              Confirm the installation of component {selectedComponent?.componentId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="installer">Installer Name</Label>
              <Input
                id="installer"
                value={installerName}
                onChange={(e) => setInstallerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any installation notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignOffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignOff} disabled={!installerName}>
              Sign Off Installation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}