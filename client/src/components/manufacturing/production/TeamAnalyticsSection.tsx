import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  BarChart, 
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  Calculator, 
  Clock, 
  Edit, 
  BarChart2, 
  Save, 
  Loader2 
} from "lucide-react";
import { ProductionLine, Project, ProjectHours } from "@/types/manufacturing";

interface TeamAnalyticsSectionProps {
  productionLine: ProductionLine;
  projects: Project[];
  isExpanded?: boolean;
}

interface EditHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectHours: ProjectHours;
  project: Project;
  productionLineId: string;
  onSave: () => void;
}

function EditHoursDialog({ 
  open, 
  onOpenChange, 
  projectHours, 
  project, 
  productionLineId,
  onSave
}: EditHoursDialogProps) {
  const [earnedHours, setEarnedHours] = useState(projectHours.earnedHours);
  const [allocatedHours, setAllocatedHours] = useState(projectHours.allocatedHours);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateHoursMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      // Make API call to update project hours
      const response = await fetch(`/api/manufacturing/production-lines/${productionLineId}/project-hours/${projectHours.projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          earnedHours,
          allocatedHours,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update project hours");
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
        description: error.message || "Failed to update project hours",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleSave = () => {
    updateHoursMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Project Hours</DialogTitle>
          <DialogDescription>
            Edit the earned and allocated hours for {project.projectNumber || project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="allocatedHours">Allocated Hours</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="allocatedHours"
                type="number"
                value={allocatedHours}
                onChange={(e) => setAllocatedHours(Number(e.target.value))}
                min={0}
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Total hours allocated to this project for the team
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="earnedHours">Earned Hours</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="earnedHours"
                type="number"
                value={earnedHours}
                onChange={(e) => setEarnedHours(Number(e.target.value))}
                min={0}
              />
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Hours earned through work completed on this project
            </p>
          </div>

          <div className="space-y-2">
            <Label>Efficiency</Label>
            <div className="bg-muted p-2 rounded-md text-center font-bold text-xl">
              {allocatedHours > 0 
                ? `${Math.round((earnedHours / allocatedHours) * 100)}%` 
                : "N/A"}
            </div>
            <Progress 
              value={allocatedHours > 0 ? (earnedHours / allocatedHours) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Hours
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamAnalyticsSection({ 
  productionLine, 
  projects,
  isExpanded = false
}: TeamAnalyticsSectionProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProjectHours, setSelectedProjectHours] = useState<ProjectHours | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Calculate analytics data
  const teamAnalytics = productionLine.teamAnalytics || {
    totalCapacity: productionLine.manpowerCapacity ? productionLine.manpowerCapacity * 40 : 0, // assume 40 hours per person
    utilization: 0,
    efficiency: 0,
    projectHours: [],
  };

  // Calculate overall efficiency and utilization if not provided
  let totalEarnedHours = 0;
  let totalAllocatedHours = 0;
  
  if (teamAnalytics.projectHours && teamAnalytics.projectHours.length > 0) {
    teamAnalytics.projectHours.forEach(ph => {
      totalEarnedHours += ph.earnedHours;
      totalAllocatedHours += ph.allocatedHours;
    });
  }

  const overallEfficiency = totalAllocatedHours > 0 
    ? (totalEarnedHours / totalAllocatedHours) 
    : 0;

  const utilization = teamAnalytics.totalCapacity > 0 
    ? (totalAllocatedHours / teamAnalytics.totalCapacity) 
    : 0;

  // Prepare chart data
  const projectHoursChartData = teamAnalytics.projectHours
    .map(ph => {
      const project = projects.find(p => p.id === ph.projectId);
      return {
        name: project?.projectNumber || "Unknown",
        allocated: ph.allocatedHours,
        earned: ph.earnedHours,
        efficiency: ph.allocatedHours > 0 ? (ph.earnedHours / ph.allocatedHours) * 100 : 0
      };
    })
    .sort((a, b) => b.allocated - a.allocated); // Sort by allocated hours descending

  // Function to handle opening the edit dialog
  const handleEditHours = (projectHours: ProjectHours) => {
    const project = projects.find(p => p.id === projectHours.projectId);
    if (project) {
      setSelectedProjectHours(projectHours);
      setSelectedProject(project);
      setEditDialogOpen(true);
    }
  };

  // Function to handle refreshing the data after save
  const handleSaveComplete = () => {
    // This will be called after successfully saving project hours
    // Additional refresh logic can be added here if needed
  };

  return (
    <div className={`space-y-4 ${isExpanded ? '' : 'max-h-[400px] overflow-y-auto'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Capacity Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamAnalytics.totalCapacity} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {productionLine.manpowerCapacity || 0} team members
            </p>
          </CardContent>
        </Card>

        {/* Utilization Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(utilization * 100)}%</div>
            <Progress value={utilization * 100} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalAllocatedHours} of {teamAnalytics.totalCapacity} hours allocated
            </p>
          </CardContent>
        </Card>

        {/* Efficiency Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(overallEfficiency * 100)}%
            </div>
            <Progress 
              value={overallEfficiency * 100} 
              className="h-2 mt-2" 
              color="bg-green-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {totalEarnedHours} earned / {totalAllocatedHours} allocated hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Hours Chart */}
      {projectHoursChartData.length > 0 && (
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectHoursChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocated" fill="#8884d8" name="Allocated Hours" />
                  <Bar dataKey="earned" fill="#82ca9d" name="Earned Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Hours Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Project Hours Tracking</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>
            Track earned vs allocated hours for each project
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Efficiency</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamAnalytics.projectHours.length > 0 ? (
                teamAnalytics.projectHours.map((projectHours) => {
                  const project = projects.find(p => p.id === projectHours.projectId);
                  const efficiency = projectHours.allocatedHours > 0 
                    ? (projectHours.earnedHours / projectHours.allocatedHours) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={projectHours.projectId}>
                      <TableCell>
                        <div className="font-medium">
                          {project?.projectNumber || "Unknown Project"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project?.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{projectHours.allocatedHours}</TableCell>
                      <TableCell className="text-right">{projectHours.earnedHours}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            efficiency >= 90 ? "default" :
                            efficiency >= 75 ? "outline" :
                            "destructive"
                          }
                        >
                          {Math.round(efficiency)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditHours(projectHours)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No project hours data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Hours Dialog */}
      {selectedProjectHours && selectedProject && (
        <EditHoursDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          projectHours={selectedProjectHours}
          project={selectedProject}
          productionLineId={productionLine.id}
          onSave={handleSaveComplete}
        />
      )}
    </div>
  );
}