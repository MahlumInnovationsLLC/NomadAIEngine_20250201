import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/lib/azure/project-service";
import { useToast } from "@/hooks/use-toast";

interface DailyRequirement {
  id: string;
  date: string;
  requester: string;
  projectId: string;
  issueDescription: string;
  needByDate: string;
  notes: string;
  status: 'OPEN' | 'CLOSED';
  group: 'Production' | 'Libby' | 'ME' | 'EE' | 'IT' | 'Supply Chain' | 'NTC' | 'QA';
  assigned: string; // Added assigned field
}

interface AddRequirementFormData {
  requester: string;
  projectId: string;
  issueDescription: string;
  needByDate: string;
  notes: string;
  group: DailyRequirement['group'];
  assigned: string; // Added assigned field
}

export function DailyRequirements() {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string>('Production');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: projects = [] } = useProjects();

  const queryClient = useQueryClient();

  const { data: requirements = [], isError } = useQuery<DailyRequirement[]>({
    queryKey: ['/api/manufacturing/daily-requirements'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/daily-requirements');
      if (!response.ok) throw new Error('Failed to fetch daily requirements');
      return response.json();
    }
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: AddRequirementFormData) => {
      const response = await fetch('/api/manufacturing/daily-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: new Date().toISOString(),
          status: 'OPEN',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create requirement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/daily-requirements'] });
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Requirement added successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add requirement",
        variant: "destructive"
      });
    }
  });

  const updateRequirement = async (id: string, updates: Partial<DailyRequirement>) => {
    try {
      const response = await fetch(`/api/manufacturing/daily-requirements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update requirement ${id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/daily-requirements'] });
    } catch (error) {
      console.error("Error updating requirement:", error);
      toast({
        title: "Error",
        description: "Failed to update requirement",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (data: AddRequirementFormData) => {
    createRequirementMutation.mutate(data);
  };

  const groups = ['Production', 'Libby', 'ME', 'EE', 'IT', 'Supply Chain', 'NTC', 'QA'];

  const filteredRequirements = requirements.filter(req => req.group === selectedGroup);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="Production" onValueChange={setSelectedGroup}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {groups.map(group => (
            <TabsTrigger key={group} value={group} className="text-xs md:text-sm">
              {group}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map(group => (
          <TabsContent key={group} value={group}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{group} Requirements</CardTitle>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>Add Requirement</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Requirement</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const data = {
                        projectId: formData.get('projectId'),
                        issueDescription: formData.get('issueDescription'),
                        needByDate: formData.get('needByDate'),
                        notes: formData.get('notes'),
                        assigned: formData.get('assigned'),
                        requester: formData.get('requester'),
                        group: selectedGroup,
                      };
                      try {
                        await createRequirementMutation.mutateAsync(data);
                        toast({
                          title: "Success",
                          description: "Requirement added successfully"
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to add requirement",
                          variant: "destructive"
                        });
                      }
                    }}>
                      <Select name="projectId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.projectNumber || 'Unknown Project'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input name="requester" placeholder="Requester Name" required />
                      <Input name="issueDescription" placeholder="Description of Issue" required />
                      <Input name="needByDate" type="date" required />
                      <Input name="notes" placeholder="Notes" />
                      <Input name="assigned" placeholder="Assigned To" />
                      <Button type="submit">Save Requirement</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Need By</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Assigned</TableHead> {/* Added Assigned column */}
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequirements.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                        <TableCell>{req.requester}</TableCell>
                        <TableCell>
                          {projects.find(p => p.id === req.projectId)?.projectNumber || 'Unknown Project'}
                        </TableCell>
                        <TableCell>
                          <Input
                            defaultValue={req.issueDescription}
                            onBlur={(e) => updateRequirement(req.id, { issueDescription: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>{new Date(req.needByDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Textarea
                            className="min-h-[100px]"
                            defaultValue={req.notes}
                            onBlur={(e) => updateRequirement(req.id, { notes: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            defaultValue={req.assigned}
                            onBlur={(e) => updateRequirement(req.id, { assigned: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={req.status}
                            onValueChange={(value) => updateRequirement(req.id, { status: value as 'OPEN' | 'CLOSED' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">OPEN</SelectItem>
                              <SelectItem value="CLOSED">CLOSED</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              try {
                                //setEditingRequirement(req);
                                //setShowEditDialog(true);
                                toast({
                                  title: "Success",
                                  description: "Requirement updated successfully"
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to update requirement",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}