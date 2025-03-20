import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPatch } from "@/lib/api-utils";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  Save, 
  PlusCircle, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Clock, 
  XCircle,
  CalendarClock,
  Wrench,
  PackageOpen,
  Hammer,
  HelpCircle,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ProductionLine, Project, TeamNeed } from "@/types/manufacturing";

interface TeamNeedsSectionProps {
  productionLine: ProductionLine;
  projects: Project[];
  isExpanded?: boolean;
}

// Define schema for team need form
const teamNeedSchema = z.object({
  type: z.enum(['part', 'tool', 'material', 'assistance', 'other']),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  requiredBy: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  owner: z.string().optional(),
  ownerEmail: z.string().email({ message: "Please enter a valid email address" }).optional(),
  sendNotification: z.boolean().default(false),
});

type TeamNeedFormValues = z.infer<typeof teamNeedSchema>;

interface TeamNeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLineId: string;
  projects: Project[];
  teamNeed?: TeamNeed;
  onSave: () => void;
  isEditing?: boolean;
}

function TeamNeedDialog({
  open,
  onOpenChange,
  productionLineId,
  projects,
  teamNeed,
  onSave,
  isEditing = false,
}: TeamNeedDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Setup form with properly typed values
  // Setup form with validation
  const form = useForm<TeamNeedFormValues>({
    resolver: zodResolver(teamNeedSchema),
    mode: "onChange", // Validates on each change
    defaultValues: {
      type: teamNeed?.type || 'part',
      description: teamNeed?.description || '',
      priority: teamNeed?.priority || 'medium',
      requiredBy: teamNeed?.requiredBy || '',
      projectId: teamNeed?.projectId || 'none',
      notes: teamNeed?.notes || '',
      owner: teamNeed?.owner || '',
      ownerEmail: teamNeed?.ownerEmail || '',
      sendNotification: teamNeed?.notificationSent || false,
    },
  });
  
  // Log form validation state in development to help debug form issues
  useEffect(() => {
    console.log("Form errors:", form.formState.errors);
    console.log("Form values:", form.getValues());
    console.log("Form dirty:", form.formState.isDirty);
    console.log("Form valid:", form.formState.isValid);
  }, [form.formState]);

  const saveTeamNeedMutation = useMutation({
    mutationFn: async (values: TeamNeedFormValues) => {
      console.log("Mutation function called with values:", values);
      
      // Determine if we're creating or updating a team need
      const url = isEditing 
        ? `/api/manufacturing/team-analytics/production-lines/${productionLineId}/team-needs/${teamNeed?.id}`
        : `/api/manufacturing/team-analytics/production-lines/${productionLineId}/team-needs`;
      
      console.log(`API Request: ${isEditing ? 'PATCH' : 'POST'} ${url}`);
      console.log("Request payload:", JSON.stringify(values, null, 2));
      
      try {
        // Use our new API utility functions that handle HTML responses
        if (isEditing) {
          return await apiPatch(url, values);
        } else {
          return await apiPost(url, values);
        }
      } catch (error) {
        console.error("Error in API operation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Team need saved successfully:", data);
      
      // Invalidate all production lines queries to ensure data is refreshed everywhere
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/production-lines'],
        type: 'all'
      });
      
      // Specifically invalidate the team needs query for this production line
      if (productionLineId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/manufacturing/team-analytics/production-lines/${productionLineId}/team-needs`],
          type: 'all'
        });
      }
      
      toast({
        title: "Success",
        description: isEditing ? "Team need updated successfully" : "Team need created successfully",
        variant: "default"
      });
      
      setIsLoading(false);
      onOpenChange(false);
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save team need",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const onSubmit = (values: TeamNeedFormValues) => {
    console.log("onSubmit called with values:", values);
    
    // Set loading state immediately
    setIsLoading(true);
    
    try {
      // Process form values before submitting
      const formattedValues = {
        ...values,
        // Convert empty strings to undefined for optional fields
        projectId: values.projectId === "none" ? undefined : values.projectId,
        requiredBy: values.requiredBy?.trim() === "" ? undefined : values.requiredBy,
        notes: values.notes?.trim() === "" ? undefined : values.notes,
        owner: values.owner?.trim() === "" ? undefined : values.owner,
        ownerEmail: values.ownerEmail?.trim() === "" ? undefined : values.ownerEmail
      };
      
      console.log("Submitting team need with formatted values:", formattedValues);
      console.log("Production line ID:", productionLineId);
      
      // Call the mutation to save the team need
      saveTeamNeedMutation.mutate(formattedValues, {
        onSuccess: (data) => {
          console.log("Team need created successfully:", data);
          toast({
            title: "Success",
            description: isEditing ? "Team need updated" : "Team need created",
          });
          onOpenChange(false);
          form.reset();
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ 
            queryKey: ['/api/manufacturing/production-lines'],
            type: 'all'
          });
          
          setIsLoading(false);
        },
        onError: (error: any) => {
          console.error("Error creating team need:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to save team need",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Exception in onSubmit:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team Need" : "Create Team Need"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the details of the existing team need"
              : "Create a new request for your team needs"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of need" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="part">
                        <div className="flex items-center">
                          <PackageOpen className="h-4 w-4 mr-2" />
                          <span>Part</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tool">
                        <div className="flex items-center">
                          <Wrench className="h-4 w-4 mr-2" />
                          <span>Tool</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="material">
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
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
                          <Settings className="h-4 w-4 mr-2" />
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
                      placeholder="Describe what your team needs"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
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
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                  <FormLabel>Associated Project (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No specific project</SelectItem>
                      {projects.map((project) => (
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
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details or context"
                      className="min-h-[60px]"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner / Assignee (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Who should take ownership of this need?"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Assign someone to handle this request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner's Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Email address for notifications"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Email address where notifications will be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendNotification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Send Email Notification
                    </FormLabel>
                    <FormDescription>
                      Send an email notification to the team about this request
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
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
                disabled={isLoading || !form.formState.isValid}
                className={`min-w-[120px] ${!form.formState.isValid && !isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : form.formState.isValid ? (
                  <>
                    <Save className="mr-2 h-4 w-4" /> {isEditing ? "Update" : "Create"}
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" /> Fix Errors
                  </>
                )}
              </Button>
            </DialogFooter>
            
            {/* Form validation summary */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="mt-4 p-4 border border-red-200 rounded-md bg-red-50">
                <h4 className="text-sm font-medium text-red-800 flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-red-700 list-disc pl-5">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      {field === 'type' && 'Need type is required'}
                      {field === 'description' && (error?.message || 'Description is required')}
                      {field === 'priority' && 'Priority is required'}
                      {field === 'ownerEmail' && (error?.message || 'Valid email is required when assigning an owner')}
                      {field !== 'type' && field !== 'description' && field !== 'priority' && field !== 'ownerEmail' && (error?.message || `${field} has an error`)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamNeedsSection({ 
  productionLine, 
  projects,
  isExpanded = false,
}: TeamNeedsSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeamNeed, setSelectedTeamNeed] = useState<TeamNeed | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if teamNeeds exists in the production line, if not create defaults
  const teamNeeds = productionLine.teamNeeds || [];

  // Filter team needs by status
  const pendingNeeds = teamNeeds.filter(need => need.status === 'pending');
  const inProgressNeeds = teamNeeds.filter(need => need.status === 'in_progress');
  const resolvedNeeds = teamNeeds.filter(need => need.status === 'resolved');

  // Function to handle editing a team need
  const handleEditTeamNeed = (teamNeed: TeamNeed) => {
    setSelectedTeamNeed(teamNeed);
    setEditDialogOpen(true);
  };

  // Function to handle updating status of a team need
  const handleUpdateStatus = async (teamNeedId: string, newStatus: 'pending' | 'in_progress' | 'resolved' | 'cancelled') => {
    setIsStatusUpdating(true);
    try {
      const response = await fetch(`/api/manufacturing/team-analytics/production-lines/${productionLine.id}/team-needs/${teamNeedId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update status");
      }

      console.log("Team need status updated successfully:", newStatus);
      
      // Invalidate all production lines queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/production-lines'],
        type: 'all'
      });
      
      // Specifically invalidate the team needs query for this production line
      queryClient.invalidateQueries({
        queryKey: [`/api/manufacturing/team-analytics/production-lines/${productionLine.id}/team-needs`],
        type: 'all'
      });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Function to handle refreshing the data
  const handleRefresh = () => {
    // Not needed since we invalidate queries in the mutations
  };

  // Function to get project name by ID
  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? (project.projectNumber || project.name) : null;
  };
  
  // Function to render priority badge
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Function to render type icon
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'part':
        return <PackageOpen className="h-4 w-4 text-blue-500" />;
      case 'tool':
        return <Wrench className="h-4 w-4 text-purple-500" />;
      case 'material':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'assistance':
        return <HelpCircle className="h-4 w-4 text-pink-500" />;
      case 'other':
        return <Settings className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${isExpanded ? '' : 'max-h-[500px] overflow-y-auto'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Needs</h3>
          <p className="text-sm text-muted-foreground">
            Manage requests for parts, tools, and assistance
          </p>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setCreateDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> Request Item
        </Button>
      </div>

      {teamNeeds.length === 0 ? (
        <Card className="bg-muted/20">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center text-center">
              <PackageOpen className="h-8 w-8 mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">No Requests</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your team hasn't requested any parts, tools, or assistance yet. Click the "Request Item" button to create one.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pending Needs Column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                Pending Requests ({pendingNeeds.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {pendingNeeds.length > 0 ? pendingNeeds.map((need) => (
                  <Card key={need.id} className="bg-muted/20">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center">
                          {renderTypeIcon(need.type)}
                          <span className="ml-2 font-medium">{need.type.charAt(0).toUpperCase() + need.type.slice(1)}</span>
                        </div>
                        {renderPriorityBadge(need.priority)}
                      </div>
                      <p className="text-sm mb-2">{need.description}</p>
                      
                      {need.projectId && (
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <span>Project: {getProjectName(need.projectId)}</span>
                        </div>
                      )}
                      
                      {need.requiredBy && (
                        <div className="flex items-center text-xs text-muted-foreground mb-2">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          <span>Needed by: {new Date(need.requiredBy).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          {new Date(need.requestedAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleUpdateStatus(need.id, 'in_progress')}
                            disabled={isStatusUpdating}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Start
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleEditTeamNeed(need)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    No pending requests
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* In Progress Needs Column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                In Progress ({inProgressNeeds.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {inProgressNeeds.length > 0 ? inProgressNeeds.map((need) => (
                  <Card key={need.id} className="bg-muted/20">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center">
                          {renderTypeIcon(need.type)}
                          <span className="ml-2 font-medium">{need.type.charAt(0).toUpperCase() + need.type.slice(1)}</span>
                        </div>
                        {renderPriorityBadge(need.priority)}
                      </div>
                      <p className="text-sm mb-2">{need.description}</p>
                      
                      {need.projectId && (
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <span>Project: {getProjectName(need.projectId)}</span>
                        </div>
                      )}
                      
                      {need.requiredBy && (
                        <div className="flex items-center text-xs text-muted-foreground mb-2">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          <span>Needed by: {new Date(need.requiredBy).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          {new Date(need.requestedAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleUpdateStatus(need.id, 'resolved')}
                            disabled={isStatusUpdating}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleEditTeamNeed(need)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    No in-progress requests
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resolved Needs Column */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Resolved ({resolvedNeeds.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {resolvedNeeds.length > 0 ? resolvedNeeds.slice(0, 5).map((need) => (
                  <Card key={need.id} className="bg-muted/20">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center">
                          {renderTypeIcon(need.type)}
                          <span className="ml-2 font-medium">{need.type.charAt(0).toUpperCase() + need.type.slice(1)}</span>
                        </div>
                        {renderPriorityBadge(need.priority)}
                      </div>
                      <p className="text-sm mb-2">{need.description}</p>
                      
                      {need.projectId && (
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <span>Project: {getProjectName(need.projectId)}</span>
                        </div>
                      )}
                      
                      {need.resolvedAt && (
                        <div className="flex items-center text-xs text-muted-foreground mb-2">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          <span>Resolved: {new Date(need.resolvedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Requested: {new Date(need.requestedAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleUpdateStatus(need.id, 'pending')}
                            disabled={isStatusUpdating}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Reopen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    No resolved requests
                  </div>
                )}
                {resolvedNeeds.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    +{resolvedNeeds.length - 5} more resolved requests
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Team Need Dialog */}
      <TeamNeedDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        productionLineId={productionLine.id}
        projects={projects}
        onSave={handleRefresh}
      />

      {/* Edit Team Need Dialog */}
      {selectedTeamNeed && (
        <TeamNeedDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          productionLineId={productionLine.id}
          projects={projects}
          teamNeed={selectedTeamNeed}
          onSave={handleRefresh}
          isEditing
        />
      )}
    </div>
  );
}