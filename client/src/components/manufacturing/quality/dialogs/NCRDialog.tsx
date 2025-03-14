import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { NCR, NCRSchema, Task } from "@/types/manufacturing/ncr";
import * as z from "zod";
import { AttachmentUploader } from "../common/AttachmentUploader";
import { TasksPanel } from "../common/TasksPanel";

interface NCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<NCR>;
  onSuccess?: () => void;
  isEditing?: boolean;
  ncr?: NCR;
  onDeleteAttachment?: (ncrId: string, attachmentId: string) => Promise<void>;
  onRefreshData?: () => void;
}

export function NCRDialog({
  open,
  onOpenChange,
  defaultValues,
  onSuccess,
  isEditing = false,
  ncr,
  onDeleteAttachment,
  onRefreshData,
}: NCRDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Array<{id: string, projectNumber: string}>>([]);

  // Area/Department options based on requirements
  const areaOptions = [
    { value: "Receiving", label: "Receiving" },
    { value: "FAB", label: "FAB" },
    { value: "Paint", label: "Paint" },
    { value: "Production", label: "Production" },
    { value: "In-Process QC", label: "In-Process QC" },
    { value: "Final QC", label: "Final QC" },
    { value: "Exec Review", label: "Exec Review" },
    { value: "PDI", label: "PDI" }
  ];
  
  // Fetch projects for the dropdown
  useEffect(() => {
    if (open) {
      const fetchProjects = async () => {
        try {
          const response = await fetch('/api/manufacturing/quality/projects');
          if (response.ok) {
            const data = await response.json();
            setProjects(data);
          } else {
            console.error('Failed to fetch projects');
            toast({
              title: "Error",
              description: "Failed to load project numbers",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
          toast({
            title: "Error",
            description: "Failed to load project numbers",
            variant: "destructive",
          });
        }
      };
      
      fetchProjects();
    }
  }, [open, toast]);

  const form = useForm<NCR>({
    resolver: zodResolver(NCRSchema),
    defaultValues: defaultValues || {
      id: "", // Will be assigned by backend
      number: "", // Will be auto-generated
      title: "",
      description: "",
      type: "product",
      severity: "minor",
      status: "draft",
      area: "",
      reportedBy: "",
      reportedDate: new Date().toISOString(),
      disposition: {
        decision: "use_as_is",
        justification: "",
        conditions: "",
        approvedBy: [],
      },
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const createNCRMutation = useMutation({
    mutationFn: async (data: NCR) => {
      const response = await fetch("/api/manufacturing/quality/ncrs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create NCR");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/quality/ncrs"] });
      toast({
        title: "Success",
        description: `NCR ${isEditing ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNCRMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<NCR> }) => {
      const response = await fetch(`/api/manufacturing/quality/ncrs/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update NCR");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/quality/ncrs"] });
      toast({
        title: "Success",
        description: "NCR updated successfully",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: NCR) => {
    try {
      setIsSubmitting(true);
      if (isEditing && defaultValues?.id) {
        await updateNCRMutation.mutateAsync({
          id: defaultValues.id,
          updates: {
            ...data,
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        await createNCRMutation.mutateAsync({
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error submitting NCR:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Non-Conformance Report</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this non-conformance report"
              : "Enter details about the non-conformance that was found"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger value="details">Details & Classification</TabsTrigger>
                <TabsTrigger value="disposition">Disposition</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the non-conformance" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a clear and concise title for this non-conformance
                      </FormDescription>
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
                          placeholder="Detailed description of the non-conformance"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the non-conformance in detail, including when and how it was discovered
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reported By</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person reporting" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area/Department</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {areaOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the department where the non-conformance occurred
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Number</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project number" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.length > 0 ? (
                              projects.map(project => (
                                <SelectItem key={project.id} value={project.projectNumber}>
                                  {project.projectNumber}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this NCR to a specific project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Lot number if applicable" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="process">Process</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="documentation">Documentation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Categorize the type of non-conformance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Rate the severity of the non-conformance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="quantityAffected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity Affected</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Number of items affected"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEditing && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the initial status of this NCR
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="disposition" className="space-y-4">
                <FormField
                  control={form.control}
                  name="disposition.decision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disposition Decision</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select disposition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="use_as_is">Use As Is</SelectItem>
                          <SelectItem value="rework">Rework</SelectItem>
                          <SelectItem value="scrap">Scrap</SelectItem>
                          <SelectItem value="return_to_supplier">Return to Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Specify how this non-conformance should be handled
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disposition.justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justification</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Justification for the selected disposition"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide reasoning for the selected disposition decision
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disposition.conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any conditions that apply to this disposition"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify any conditions that must be met for this disposition
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dispositionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this disposition"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="tasks" className="space-y-4">
                {isEditing ? (
                  <TasksPanel
                    tasks={form.getValues('tasks') || []}
                    onAddTask={(task: Task) => {
                      const currentTasks = form.getValues('tasks') || [];
                      form.setValue('tasks', [...currentTasks, task], { shouldValidate: true });
                    }}
                    onUpdateTask={(taskId: string, updates: Partial<Task>) => {
                      const currentTasks = form.getValues('tasks') || [];
                      const updatedTasks = currentTasks.map((task: Task) => 
                        task.id === taskId ? { ...task, ...updates } : task
                      );
                      form.setValue('tasks', updatedTasks, { shouldValidate: true });
                    }}
                    onDeleteTask={(taskId: string) => {
                      const currentTasks = form.getValues('tasks') || [];
                      const updatedTasks = currentTasks.filter((task: Task) => task.id !== taskId);
                      form.setValue('tasks', updatedTasks, { shouldValidate: true });
                    }}
                    readonly={!isEditing}
                  />
                ) : (
                  <div className="border rounded-md p-6 text-center text-muted-foreground">
                    <p>You can add tasks after creating the NCR</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                {isEditing && ncr ? (
                  <div className="space-y-6">
                    <div className="border rounded-md p-4 bg-muted/20">
                      <h3 className="text-lg font-medium mb-2">Current Attachments</h3>
                      {ncr.attachments && ncr.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ncr.attachments.map((attachment) => (
                            <div 
                              key={attachment.id} 
                              className="flex items-center justify-between p-3 border rounded-md bg-card"
                            >
                              <div className="flex items-center">
                                <FontAwesomeIcon 
                                  icon="file" 
                                  className="h-5 w-5 mr-2 text-primary" 
                                />
                                <div>
                                  <p className="font-medium truncate max-w-xs">{attachment.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.round(attachment.fileSize / 1024)} KB
                                  </p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  // Handle delete action
                                  if (onDeleteAttachment) {
                                    onDeleteAttachment(ncr.id, attachment.id);
                                  }
                                }}
                              >
                                <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No attachments added yet.</p>
                      )}
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">Upload New Attachment</h3>
                      <AttachmentUploader 
                        parentId={ncr.id} 
                        parentType="ncr"
                        onSuccess={() => {
                          // Refresh the NCR data after upload
                          if (onRefreshData) {
                            onRefreshData();
                          }
                        }} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-md">
                    <h3 className="text-lg font-medium mb-2">Upload Attachments</h3>
                    <p className="text-muted-foreground mb-4">
                      Add supporting documentation for this NCR.
                    </p>
                    <AttachmentUploader 
                      parentId={isEditing && ncr ? ncr.id : `temp-${Date.now()}`} 
                      parentType="ncr"
                      onSuccess={() => {
                        if (onRefreshData) {
                          onRefreshData();
                        }
                      }} 
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <div className="flex gap-2 justify-end w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {isEditing ? "Update" : "Create"} NCR
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}