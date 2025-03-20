import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter, 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  PlusCircle, 
  BarChart3, 
  UserCheck, 
  Loader2, 
  Save, 
  Clock4,
  Calendar, 
  ClipboardEdit,
  BarChart2,
  User,
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ProductionLine, Project, ProjectHours, TeamAnalytics } from "@/types/manufacturing";

interface TeamAnalyticsSectionProps {
  productionLine: ProductionLine;
  projects: Project[];
  isExpanded?: boolean;
}

interface HoursUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLineId: string;
  project: Project;
  projectHours: ProjectHours | undefined;
  onSave: () => void;
}

// Define schema for hours update form
const hoursUpdateSchema = z.object({
  earnedHours: z.coerce.number().min(0, { message: "Earned hours cannot be negative" }),
  allocatedHours: z.coerce.number().min(0, { message: "Allocated hours cannot be negative" }),
});

type HoursUpdateFormValues = z.infer<typeof hoursUpdateSchema>;

function HoursUpdateDialog({
  open,
  onOpenChange,
  productionLineId,
  project,
  projectHours,
  onSave,
}: HoursUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up form
  const form = useForm<HoursUpdateFormValues>({
    resolver: zodResolver(hoursUpdateSchema),
    defaultValues: {
      earnedHours: projectHours?.earnedHours || 0,
      allocatedHours: projectHours?.allocatedHours || 0,
    },
  });

  const updateHoursMutation = useMutation({
    mutationFn: async (values: HoursUpdateFormValues) => {
      setIsLoading(true);
      
      const response = await fetch(`/api/manufacturing/team-analytics/production-lines/${productionLineId}/project-hours/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update hours");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/production-lines'],
        refetchType: 'all' 
      });
      toast({
        title: "Success",
        description: "Project hours updated successfully",
      });
      setIsLoading(false);
      onOpenChange(false);
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update hours",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const onSubmit = (values: HoursUpdateFormValues) => {
    updateHoursMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Project Hours</DialogTitle>
          <DialogDescription>
            Update earned and allocated hours for {project.projectNumber || project.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="earnedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Earned Hours</FormLabel>
                  <FormDescription>
                    Hours the team has earned on this project
                  </FormDescription>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allocatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocated Hours</FormLabel>
                  <FormDescription>
                    Total hours allocated to this project
                  </FormDescription>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamAnalyticsSection({ 
  productionLine, 
  projects,
  isExpanded = false
}: TeamAnalyticsSectionProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Check if teamAnalytics exists in the production line, if not create defaults
  const teamAnalytics = productionLine.teamAnalytics || {
    totalCapacity: productionLine.manpowerCapacity ? productionLine.manpowerCapacity * 40 : 0, // assuming 40 hours per team member per week
    utilization: 0,
    efficiency: 0,
    projectHours: [],
  };

  // Get assigned projects and their hours
  const assignedProjectIds = productionLine.assignedProjects || [];
  const assignedProjects = projects.filter(project => assignedProjectIds.includes(project.id));
  
  // Function to handle opening the hours update dialog
  const handleUpdateHours = (project: Project) => {
    setSelectedProject(project);
    setUpdateDialogOpen(true);
  };

  // Function to get project hours by project ID
  const getProjectHours = (projectId: string) => {
    return teamAnalytics.projectHours?.find(ph => ph.projectId === projectId);
  };

  // Function to handle refreshing the data
  const handleRefresh = () => {
    // Not needed since we invalidate queries in the mutations
  };

  // Calculate total earned and allocated hours
  const totalEarnedHours = teamAnalytics.projectHours?.reduce((total, ph) => total + ph.earnedHours, 0) || 0;
  const totalAllocatedHours = teamAnalytics.projectHours?.reduce((total, ph) => total + ph.allocatedHours, 0) || 0;
  
  // Calculate usage percentage for the progress bar
  const capacityUsagePercentage = teamAnalytics.totalCapacity > 0 
    ? Math.min(100, Math.round((totalAllocatedHours / teamAnalytics.totalCapacity) * 100)) 
    : 0;

  // Calculate efficiency percentage
  const efficiencyPercentage = totalAllocatedHours > 0 
    ? Math.min(100, Math.round((totalEarnedHours / totalAllocatedHours) * 100)) 
    : 0;

  return (
    <div className={`space-y-4 ${isExpanded ? '' : 'max-h-[400px] overflow-y-auto'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track team capacity and project hours allocation
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {teamAnalytics.totalCapacity} hours
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {productionLine.manpowerCapacity || 0} team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Allocated Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock4 className="h-5 w-5 mr-2 text-orange-500" />
              <div className="text-2xl font-bold">
                {totalAllocatedHours} hours
              </div>
            </div>
            <div className="mt-2">
              <Progress value={capacityUsagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {capacityUsagePercentage}% of total capacity used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-green-500" />
              <div className="text-2xl font-bold">
                {efficiencyPercentage}%
              </div>
            </div>
            <div className="mt-2">
              <Progress value={efficiencyPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {totalEarnedHours} earned / {totalAllocatedHours} allocated hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Hours Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Project Hours Allocation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Allocated Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Earned Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Efficiency</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Last Updated</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignedProjects.length > 0 ? (
                  assignedProjects.map((project) => {
                    const projectHours = getProjectHours(project.id);
                    const efficiency = projectHours?.allocatedHours ? 
                      Math.round((projectHours.earnedHours / projectHours.allocatedHours) * 100) : 0;
                    
                    return (
                      <tr key={project.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-sm">
                          {project.projectNumber || project.name}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {projectHours?.allocatedHours || 0}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {projectHours?.earnedHours || 0}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center">
                            <Progress 
                              value={efficiency} 
                              className="h-2 w-16 mr-2" 
                            />
                            <span>{efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {projectHours?.lastUpdated ? 
                            new Date(projectHours.lastUpdated).toLocaleDateString() : 
                            'Never'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateHours(project)}
                          >
                            <ClipboardEdit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-8 w-8 mb-2" />
                        <p>No projects assigned to this team</p>
                        <p className="text-xs mt-1">
                          Assign projects to track hours and efficiency
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hours Update Dialog */}
      {selectedProject && (
        <HoursUpdateDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          productionLineId={productionLine.id}
          project={selectedProject}
          projectHours={getProjectHours(selectedProject.id)}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
}