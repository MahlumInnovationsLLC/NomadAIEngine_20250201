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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  PlusCircle, 
  AlertOctagon, 
  Check, 
  ArrowRight,
  X, 
  Loader2, 
  AlertTriangle,
  Tool,
  Wrench,
  Package,
  HelpCircle,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { ProductionLine, Project, TeamNeed } from "@/types/manufacturing";

// Define schema for team need form
const teamNeedSchema = z.object({
  type: z.enum(['part', 'tool', 'material', 'assistance', 'other']),
  description: z.string().min(3, { message: "Description must be at least 3 characters" }),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  requiredBy: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
});

type TeamNeedFormValues = z.infer<typeof teamNeedSchema>;

interface TeamNeedsSectionProps {
  productionLine: ProductionLine;
  projects: Project[];
  isExpanded?: boolean;
}

interface AddTeamNeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLineId: string;
  projects: Project[];
  onSave: () => void;
}

function AddTeamNeedDialog({ 
  open, 
  onOpenChange, 
  productionLineId,
  projects,
  onSave,
}: AddTeamNeedDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up form
  const form = useForm<TeamNeedFormValues>({
    resolver: zodResolver(teamNeedSchema),
    defaultValues: {
      type: 'part',
      description: '',
      priority: 'medium',
      requiredBy: '',
      projectId: '',
      notes: '',
    },
  });

  const addTeamNeedMutation = useMutation({
    mutationFn: async (values: TeamNeedFormValues) => {
      setIsLoading(true);
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLineId}/team-needs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add team need");
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
        description: "Team need added successfully",
      });
      setIsLoading(false);
      onOpenChange(false);
      onSave();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team need",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const onSubmit = (values: TeamNeedFormValues) => {
    addTeamNeedMutation.mutate(values);
  };

  // Render icon based on need type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'part':
        return <Package className="h-4 w-4" />;
      case 'tool':
        return <Tool className="h-4 w-4" />;
      case 'material':
        return <Package className="h-4 w-4" />;
      case 'assistance':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Need</DialogTitle>
          <DialogDescription>
            Add a part request, roadblock, or missing item that your team needs
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type of need" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="part">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          <span>Part</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tool">
                        <div className="flex items-center">
                          <Tool className="h-4 w-4 mr-2" />
                          <span>Tool</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="material">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          <span>Material</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="assistance">
                        <div className="flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          <span>Assistance</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center">
                          <Wrench className="h-4 w-4 mr-2" />
                          <span>Other</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you need..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about what's needed and why it's important
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">Low</Badge>
                            <span>Can wait</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center">
                            <Badge variant="secondary" className="mr-2">Medium</Badge>
                            <span>Somewhat urgent</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center">
                            <Badge variant="default" className="mr-2">High</Badge>
                            <span>Urgent need</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center">
                            <Badge variant="destructive" className="mr-2">Critical</Badge>
                            <span>Blocking progress</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required By</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Project</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select related project (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">-- No specific project --</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectNumber || project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information..." 
                      {...field} 
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Need
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

interface UpdateTeamNeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamNeed: TeamNeed;
  productionLineId: string;
  onSave: () => void;
}

function UpdateTeamNeedDialog({ 
  open, 
  onOpenChange, 
  teamNeed,
  productionLineId,
  onSave,
}: UpdateTeamNeedDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTeamNeedMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      
      // Mark the need as resolved
      const resolvedNeed = {
        ...teamNeed,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      };
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLineId}/team-needs/${teamNeed.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resolvedNeed),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update team need");
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
        description: "Team need marked as resolved",
      });
      setIsLoading(false);
      onOpenChange(false);
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team need",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const deleteTeamNeedMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLineId}/team-needs/${teamNeed.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete team need");
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
        description: "Team need deleted successfully",
      });
      setIsLoading(false);
      onOpenChange(false);
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team need",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleResolve = () => {
    updateTeamNeedMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this need?")) {
      deleteTeamNeedMutation.mutate();
    }
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  // Get need type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'part':
        return <Package className="h-4 w-4" />;
      case 'tool':
        return <Tool className="h-4 w-4" />;
      case 'material':
        return <Package className="h-4 w-4" />;
      case 'assistance':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getTypeIcon(teamNeed.type)}
            <span className="ml-2">
              {teamNeed.type.charAt(0).toUpperCase() + teamNeed.type.slice(1)} Need
            </span>
          </DialogTitle>
          <DialogDescription>
            View details and resolve this team need
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Priority</h3>
              {getPriorityBadge(teamNeed.priority)}
            </div>
            {teamNeed.requiredBy && (
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Required by: {new Date(teamNeed.requiredBy).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <div className="bg-muted p-3 rounded-md">
              {teamNeed.description}
            </div>
          </div>

          {teamNeed.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Additional Notes</h3>
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                {teamNeed.notes}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Status Information</h3>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm">Status</div>
                <Badge 
                  variant={
                    teamNeed.status === 'resolved' ? 'default' :
                    teamNeed.status === 'in_progress' ? 'secondary' :
                    teamNeed.status === 'cancelled' ? 'destructive' :
                    'outline'
                  }
                >
                  {teamNeed.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-sm flex">
                <span className="text-muted-foreground">Requested: </span>
                <span className="ml-1">{new Date(teamNeed.requestedAt).toLocaleString()}</span>
              </div>
              {teamNeed.requestedBy && (
                <div className="text-sm flex">
                  <span className="text-muted-foreground">Requested by: </span>
                  <span className="ml-1">{teamNeed.requestedBy}</span>
                </div>
              )}
              {teamNeed.resolvedAt && (
                <div className="text-sm flex">
                  <span className="text-muted-foreground">Resolved: </span>
                  <span className="ml-1">{new Date(teamNeed.resolvedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <div className="flex-1 flex gap-2 justify-start">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Close
          </Button>
          
          {teamNeed.status !== 'resolved' && (
            <Button 
              onClick={handleResolve}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving...
                </>
              ) : (
                <>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Mark as Resolved
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamNeedsSection({ 
  productionLine, 
  projects,
  isExpanded = false
}: TeamNeedsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<TeamNeed | null>(null);

  // Get all team needs
  const teamNeeds = productionLine.teamNeeds || [];
  const pendingNeeds = teamNeeds.filter(need => need.status === 'pending' || need.status === 'in_progress');
  const resolvedNeeds = teamNeeds.filter(need => need.status === 'resolved' || need.status === 'cancelled');

  // Function to handle opening the edit dialog
  const handleViewNeed = (need: TeamNeed) => {
    setSelectedNeed(need);
    setUpdateDialogOpen(true);
  };

  // Function to get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  // Function to get need type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'part':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'tool':
        return <Tool className="h-4 w-4 text-orange-500" />;
      case 'material':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'assistance':
        return <HelpCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Wrench className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to get type name with proper formatting
  const getTypeName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Function to handle refreshing the data
  const handleRefresh = () => {
    // Not needed since we invalidate queries in the mutations
  };

  return (
    <div className={`space-y-4 ${isExpanded ? '' : 'max-h-[400px] overflow-y-auto'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Needs</h3>
          <p className="text-sm text-muted-foreground">
            Track parts, tools, and assistance needed by the team
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Need
        </Button>
      </div>

      {/* Active Needs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Active Needs</CardTitle>
            <Badge variant="outline">{pendingNeeds.length} pending</Badge>
          </div>
          <CardDescription>
            Parts, tools, and assistance needed for ongoing work
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {pendingNeeds.length > 0 ? (
              pendingNeeds
                .sort((a, b) => {
                  // Sort by priority (critical first)
                  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                  return priorityOrder[a.priority as keyof typeof priorityOrder] - 
                         priorityOrder[b.priority as keyof typeof priorityOrder];
                })
                .map(need => {
                  const relatedProject = projects.find(p => p.id === need.projectId);
                  return (
                    <div 
                      key={need.id} 
                      className="p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewNeed(need)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(need.type)}
                          <span className="font-medium">
                            {getTypeName(need.type)}
                          </span>
                        </div>
                        {getPriorityBadge(need.priority)}
                      </div>
                      <p className="text-sm mb-2">{need.description}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center">
                          {need.requiredBy && (
                            <div className="flex items-center mr-3">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(need.requiredBy).toLocaleDateString()}
                            </div>
                          )}
                          {relatedProject && (
                            <div>Project: {relatedProject.projectNumber}</div>
                          )}
                        </div>
                        <div>
                          {new Date(need.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <div className="flex justify-center mb-2">
                  <Check className="h-6 w-6" />
                </div>
                <p>No active needs at the moment</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add a Need
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolved Needs */}
      {resolvedNeeds.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Resolved Needs</CardTitle>
              <Badge variant="outline">{resolvedNeeds.length} completed</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {resolvedNeeds
                .slice(0, 3) // Show only the most recent 3 resolved needs
                .map(need => (
                  <div 
                    key={need.id} 
                    className="p-3 hover:bg-muted/50 cursor-pointer opacity-70"
                    onClick={() => handleViewNeed(need)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(need.type)}
                        <span className="font-medium line-through">
                          {getTypeName(need.type)}
                        </span>
                      </div>
                      <Badge variant="outline">Resolved</Badge>
                    </div>
                    <p className="text-sm mb-2 line-through">{need.description}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div>
                        Resolved: {need.resolvedAt && new Date(need.resolvedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              
              {resolvedNeeds.length > 3 && (
                <div className="p-3 text-center">
                  <Button variant="ghost" size="sm">
                    View All {resolvedNeeds.length} Resolved Needs
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Team Need Dialog */}
      <AddTeamNeedDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        productionLineId={productionLine.id}
        projects={projects}
        onSave={handleRefresh}
      />

      {/* Update Team Need Dialog */}
      {selectedNeed && (
        <UpdateTeamNeedDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          teamNeed={selectedNeed}
          productionLineId={productionLine.id}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
}