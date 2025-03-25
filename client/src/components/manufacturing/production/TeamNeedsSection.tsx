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

interface TeamNeedApiResponse {
  message: string;
  teamNeed: TeamNeed;
  mailtoLink?: string | null;
}

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
  productionLineId: z.string().optional(), // Allow it to be optional in the schema but ensure it's populated in the form
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
      productionLineId: teamNeed?.productionLineId || productionLineId, // Initialize with the passed production line ID
      notes: teamNeed?.notes || '',
      owner: teamNeed?.owner || '',
      ownerEmail: teamNeed?.ownerEmail || '',
      sendNotification: teamNeed?.notificationSent || false,
    },
  });
  
  console.log("TeamNeedDialog initialized with productionLineId:", productionLineId);
  
  // Log form validation state in development to help debug form issues
  useEffect(() => {
    console.log("Form errors:", form.formState.errors);
    console.log("Form values:", form.getValues());
    console.log("Form dirty:", form.formState.isDirty);
    console.log("Form valid:", form.formState.isValid);
  }, [form.formState]);

  const saveTeamNeedMutation = useMutation<TeamNeedApiResponse, Error, TeamNeedFormValues>({
    mutationFn: async (values: TeamNeedFormValues) => {
      console.log("🟢 DEBUGGING: Mutation function called with values:", values);
      console.log("🟢 DEBUGGING: Production line ID in mutationFn:", productionLineId);
      
      // Make sure we have a productionLineId either from the prop or the values
      const effectiveProductionLineId = values.productionLineId || productionLineId;
      
      if (!effectiveProductionLineId) {
        console.error("🔴 CRITICAL ERROR: Production line ID is missing in both props and values");
        throw new Error("Production line ID is required");
      }
      
      // Determine if we're creating or updating a team need
      const url = isEditing 
        ? `/api/manufacturing/team-analytics/production-lines/${effectiveProductionLineId}/team-needs/${teamNeed?.id}`
        : `/api/manufacturing/team-analytics/production-lines/${effectiveProductionLineId}/team-needs`;
      
      console.log(`🟢 DEBUGGING: API Request: ${isEditing ? 'PATCH' : 'POST'} ${url}`);
      console.log("🟢 DEBUGGING: Request payload:", JSON.stringify(values, null, 2));
      
      // Generate a mailto link for email fallback if sending notification
      if (values.sendNotification && values.ownerEmail) {
        try {
          // We no longer need to create our own mailto link in the client
          // The server will create it and send it back in the response
          console.log("🟢 DEBUGGING: Email notification requested, server will handle it");
        } catch (e) {
          console.error("🔴 DEBUGGING ERROR: Error creating mailto link:", e);
        }
      }
      
      // Prepare the payload that explicitly includes productionLineId
      const payload = {
        ...values,
        productionLineId: effectiveProductionLineId
      };
      
      console.log("🟢 DEBUGGING: Final payload with explicit productionLineId:", JSON.stringify(payload, null, 2));
      
      try {
        console.log(`🟢 DEBUGGING: Making ${isEditing ? 'PATCH' : 'POST'} request to ${url}`);
        
        // Direct fetch to ensure we have a successful API call
        const directResponse = await fetch(url, {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          // Add credentials to ensure cookies are sent
          credentials: 'include'
        });
        
        console.log(`🟢 DEBUGGING: Direct fetch response status: ${directResponse.status}`);
        
        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          console.error("🔴 DEBUGGING ERROR: Error response from server:", errorText);
          throw new Error(`API request failed with status ${directResponse.status}: ${errorText}`);
        }
        
        try {
          const responseText = await directResponse.text();
          console.log("🟢 DEBUGGING: Raw response text:", responseText);
          
          // Try to parse the response as JSON
          let responseData: TeamNeedApiResponse;
          try {
            responseData = JSON.parse(responseText) as TeamNeedApiResponse;
            console.log("🟢 DEBUGGING: Successfully parsed response JSON:", responseData);
            
            // Check specifically for mailtoLink
            if (responseData.mailtoLink) {
              console.log("🟢 DEBUGGING: Server returned mailtoLink:", responseData.mailtoLink);
            } else {
              console.warn("🟡 DEBUGGING WARNING: Server did not return mailtoLink in response");
            }
            
          } catch (parseError) {
            console.error("🔴 DEBUGGING ERROR: Failed to parse response as JSON:", parseError);
            throw new Error(`Invalid JSON response: ${responseText}`);
          }
          
          return responseData;
        } catch (textError) {
          console.error("🔴 DEBUGGING ERROR: Error getting response text:", textError);
          throw textError;
        }
      } catch (directError) {
        console.error("🔴 DEBUGGING ERROR: Direct fetch error:", directError);
        
        console.log("🟢 DEBUGGING: Trying fallback with API utility functions");
        // Use our API utility functions as fallback
        try {
          const apiResponse = isEditing 
            ? await apiPatch<TeamNeedApiResponse>(url, payload)
            : await apiPost<TeamNeedApiResponse>(url, payload);
          
          console.log("🟢 DEBUGGING: API utility response:", apiResponse);
          
          // Check specifically for mailtoLink in the fallback
          if (apiResponse.mailtoLink) {
            console.log("🟢 DEBUGGING: Fallback returned mailtoLink:", apiResponse.mailtoLink);
          } else {
            console.warn("🟡 DEBUGGING WARNING: Fallback did not return mailtoLink in response");
          }
          
          return apiResponse;
        } catch (apiError) {
          console.error("🔴 DEBUGGING ERROR: Error in API operation:", apiError);
          throw apiError;
        }
      }
    },
    onSuccess: (data) => {
      console.log("✅ Team need saved successfully:", data);
      
      // Execute success steps in a try/catch to make it more robust
      try {
        // Double-check if we received the expected data shape
        if (!data || !data.teamNeed || !data.teamNeed.id) {
          console.error("⛔ Invalid response data structure:", data);
          throw new Error("Server returned an invalid response");
        }
        
        console.log("🔄 Server returned team need ID:", data.teamNeed.id);
        
        // More systematic approach to cache invalidation
        console.log("🔄 Starting cache invalidation sequence");
        
        // First, remove specific cached items
        if (productionLineId) {
          const teamNeedsQueryKey = `/api/manufacturing/team-analytics/production-lines/${productionLineId}/team-needs`;
          console.log(`🔄 Removing specific query cache: ${teamNeedsQueryKey}`);
          queryClient.removeQueries({ queryKey: [teamNeedsQueryKey] });
        }
        
        // Then invalidate parent queries
        console.log(`🔄 Invalidating production lines query`);
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/production-lines'],
          exact: false // This ensures it invalidates all nested queries too
        });
        
        // Force an immediate refetch of the key queries
        console.log(`🔄 Forcing refetch of production lines data`);
        queryClient.refetchQueries({ 
          queryKey: ['/api/manufacturing/production-lines'],
          type: 'active' // Only refetch queries that are currently rendered
        });
        
        // Close the dialog first to prevent UI freezing
        console.log("🔄 Closing dialog first to prevent UI freezing");
        setIsLoading(false);
        onOpenChange(false);
        
        // Store values for use after dialog closes
        const mailtoLink = data.mailtoLink;
        const isNotificationRequested = form.getValues().sendNotification;
        
        console.log(`🔄 Email notification requested: ${isNotificationRequested}, Mailto link from server: ${!!mailtoLink}`);
        
        // Wait for dialog to completely close before showing toast and opening email
        // Use a longer timeout to ensure dialog is fully closed
        setTimeout(() => {
          if (isNotificationRequested && mailtoLink) {
            toast({
              title: "Success",
              description: isEditing 
                ? "Team need updated successfully. Opening email client..." 
                : "Team need created successfully. Opening email client...",
              variant: "default"
            });
            
            // Open the email client with a further delay to ensure toast is shown and UI is updated
            setTimeout(() => {
              console.log("🔄 Opening email client with mailto link from server");
              // Use a try-catch to handle potential issues with window.open
              try {
                console.log("🔴 CRITICAL DEBUG: Attempting to open mailto link:", mailtoLink);
                
                // CRITICAL FIX: Use direct location change instead of window.open for mailto 
                // This has much higher success rate with email clients
                try {
                  // Force using window.location for mailto links which works better with email clients
                  window.location.href = mailtoLink;
                  console.log("🔴 CRITICAL DEBUG: Redirected to mailto link using window.location");
                } catch (locationError) {
                  console.error("🔴 CRITICAL DEBUG: Error with location redirect:", locationError);
                  
                  // Fallback to window.open approach
                  try {
                    console.log("🔴 CRITICAL DEBUG: Trying fallback with window.open");
                    const emailWindow = window.open(mailtoLink, '_blank');
                    
                    // Handle potential popup blockers
                    if (!emailWindow || emailWindow.closed || typeof emailWindow.closed === 'undefined') {
                      console.warn("🔴 CRITICAL DEBUG: Email client could not be opened (possible popup blocker)");
                      alert("Please click OK and then we'll try to open your email client. If it doesn't open, check popup blockers or copy this link:\n\n" + mailtoLink);
                      
                      // Last resort - try direct href again after alert
                      window.location.href = mailtoLink;
                    }
                  } catch (windowError) {
                    console.error("🔴 CRITICAL DEBUG: All email opening methods failed:", windowError);
                    alert("Unable to open email client automatically. Please try manually with this link:\n\n" + mailtoLink);
                  }
                }
              } catch (emailError) {
                console.error("🔴 Error opening email client:", emailError);
                // Show a toast when email client fails to open
                toast({
                  title: "Notice",
                  description: "Unable to open email client automatically. Please try manually.",
                  variant: "default"
                });
              }
            }, 300); // Delay email opening by 300ms after toast
          } else {
            toast({
              title: "Success",
              description: isEditing ? "Team need updated successfully" : "Team need created successfully",
              variant: "default"
            });
          }
          
          // Trigger onSave to update UI after the dialog is closed
          console.log("🔄 Calling onSave callback");
          onSave();
          
          // Add additional check to ensure data refresh
          setTimeout(() => {
            console.log("🔄 Forcing additional refetch after save");
            queryClient.refetchQueries({ 
              queryKey: ['/api/manufacturing/production-lines'],
              type: 'all' 
            });
          }, 300);
        }, 100);
        
      } catch (error) {
        console.error("🔴 Error in onSuccess handler:", error);
        // Ensure we still close the dialog even if there's an error
        setIsLoading(false);
        onOpenChange(false);
        
        // Show a more specific toast message
        toast({
          title: "Team need saved",
          description: "Team need was saved, but there were some issues with the UI update. The page will refresh to show your changes.",
          variant: "default"
        });
        
        // Wait briefly then trigger refresh
        setTimeout(() => {
          onSave();
          // Force a refetch even on error as a fallback
          queryClient.refetchQueries({ 
            queryKey: ['/api/manufacturing/production-lines'],
            type: 'all'
          });
        }, 100);
      }
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
    console.log("⭐ onSubmit called with values:", values);
    
    // Set loading state immediately
    setIsLoading(true);
    
    try {
      // Process form values before submitting
      const formattedValues = {
        ...values,
        // Explicitly include the productionLineId
        productionLineId,
        // Convert empty strings to undefined for optional fields
        projectId: values.projectId === "none" ? undefined : values.projectId,
        requiredBy: values.requiredBy?.trim() === "" ? undefined : values.requiredBy,
        notes: values.notes?.trim() === "" ? undefined : values.notes,
        owner: values.owner?.trim() === "" ? undefined : values.owner,
        ownerEmail: values.ownerEmail?.trim() === "" ? undefined : values.ownerEmail
      };
      
      console.log("⭐ Submitting team need with formatted values:", JSON.stringify(formattedValues, null, 2));
      console.log("⭐ Production line ID:", productionLineId);
      
      // Verify that the form is valid before submitting
      if (!form.formState.isValid) {
        console.error("⭐ Form is invalid - checking errors:", form.formState.errors);
        Object.entries(form.formState.errors).forEach(([field, error]) => {
          console.error(`⭐ Field ${field} error:`, error);
        });
        setIsLoading(false);
        toast({
          title: "Form Validation Error",
          description: "Please check form fields for errors",
          variant: "destructive",
        });
        return;
      }
      
      // Call the mutation to save the team need with explicit productionLineId passed as a parameter for debugging
      console.log(`⭐ Calling mutation for productionLine: ${productionLineId}`);
      saveTeamNeedMutation.mutate({
        ...formattedValues,
        productionLineId: productionLineId,
      });
    } catch (error) {
      console.error("⭐ Exception in onSubmit:", error);
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

            <DialogFooter className="flex flex-col sm:flex-row mt-6 gap-2">
              <div className="w-full flex items-center justify-between gap-2 sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !form.formState.isValid}
                  className={`flex-1 min-w-[120px] ${!form.formState.isValid && !isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              </div>
              
              {/* User-facing emergency tools with email fallbacks */}
              {form.getValues().ownerEmail && (
                <div className="w-full flex flex-col mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Email Options - Use these if automatic email client opening fails
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button"
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        const ownerEmail = form.getValues().ownerEmail;
                        if (ownerEmail) {
                          // Create a more detailed backup email
                          const values = form.getValues();
                          const subject = `Team Need: ${values.type} (${values.priority.toUpperCase()})`;
                          
                          // Create a detailed email body
                          const body = `
Team Need: ${values.type} (${values.priority.toUpperCase()})
Description: ${values.description || 'No description provided'}
${values.requiredBy ? `Required By: ${values.requiredBy}\n` : ''}
${values.projectId && values.projectId !== 'none' ? `Project ID: ${values.projectId}\n` : ''}
${values.notes ? `Notes: ${values.notes}\n` : ''}
Requested By: ${values.requestedBy || 'System User'}
Requested At: ${new Date().toLocaleString()}

You have been assigned as the owner of this team need.
`;

                          const emergencyMailtoLink = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          console.log("🔄 Using direct mailto:", emergencyMailtoLink);
                          window.location.href = emergencyMailtoLink;
                        } else {
                          toast({
                            title: "Missing Email",
                            description: "Please enter an owner email address first",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="text-xs"
                    >
                      <Mail className="h-3 w-3 mr-1" /> Open Email Client
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const ownerEmail = form.getValues().ownerEmail;
                        if (ownerEmail) {
                          // Create a more detailed backup email
                          const values = form.getValues();
                          const subject = `Team Need: ${values.type} (${values.priority.toUpperCase()})`;
                          
                          // Create a detailed email body
                          const body = `
Team Need: ${values.type} (${values.priority.toUpperCase()})
Description: ${values.description || 'No description provided'}
${values.requiredBy ? `Required By: ${values.requiredBy}\n` : ''}
${values.projectId && values.projectId !== 'none' ? `Project ID: ${values.projectId}\n` : ''}
${values.notes ? `Notes: ${values.notes}\n` : ''}
Requested By: ${values.requestedBy || 'System User'}
Requested At: ${new Date().toLocaleString()}

You have been assigned as the owner of this team need.
`;

                          const emailText = `To: ${ownerEmail}\nSubject: ${subject}\n\n${body}`;
                          
                          // Copy to clipboard
                          navigator.clipboard.writeText(emailText)
                            .then(() => {
                              toast({
                                title: "Email Copied",
                                description: "Email content copied to clipboard. Paste into your email client to send.",
                                variant: "default",
                              });
                            })
                            .catch(err => {
                              console.error("Failed to copy email:", err);
                              toast({
                                title: "Copy Failed",
                                description: "Unable to copy email to clipboard. Try the Open Email button instead.",
                                variant: "destructive",
                              });
                            });
                        } else {
                          toast({
                            title: "Missing Email",
                            description: "Please enter an owner email address first",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy Email Text
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const formData = form.getValues();
                        console.log("Form data:", formData);
                        toast({
                          title: "Form Data Logged",
                          description: "Current form data has been logged to the console",
                          variant: "default",
                        });
                      }}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" /> Log Form Data
                    </Button>
                  </div>
                </div>
              )}
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

  // Log productionLine details to help debug productionLineId issues
  console.log("TeamNeedsSection - productionLine:", productionLine?.id);

  // Check if teamNeeds exists in the production line, if not create defaults
  // Ensure all team needs have a productionLineId
  const teamNeeds = (productionLine?.teamNeeds || []).map(need => {
    // Create a properly typed TeamNeed object with all required properties
    return {
      ...need,
      productionLineId: need.productionLineId || productionLine?.id || '',
      // Ensure these required properties exist (they should be there from the server)
      requestedBy: need.requestedBy || 'Unknown',
      requestedAt: need.requestedAt || new Date().toISOString()
    } as TeamNeed;
  });

  // Filter team needs by status
  const pendingNeeds = teamNeeds.filter(need => need.status === 'pending');
  const inProgressNeeds = teamNeeds.filter(need => need.status === 'in_progress');
  const resolvedNeeds = teamNeeds.filter(need => need.status === 'resolved');

  // Function to handle editing a team need
  const handleEditTeamNeed = (teamNeed: TeamNeed) => {
    console.log("💎 Editing team need:", teamNeed);
    // Ensure the team need has the production line ID
    const enrichedTeamNeed: TeamNeed = {
      ...teamNeed,
      // Set productionLineId if it's missing, using the current production line's ID
      productionLineId: teamNeed.productionLineId || productionLine?.id || '',
      // Ensure these required properties exist
      requestedBy: teamNeed.requestedBy || 'Unknown',
      requestedAt: teamNeed.requestedAt || new Date().toISOString()
    };
    console.log("⭐ Editing team need with productionLineId:", enrichedTeamNeed.productionLineId);
    setSelectedTeamNeed(enrichedTeamNeed);
    setEditDialogOpen(true);
  };

  // Function to handle updating status of a team need
  const handleUpdateStatus = async (teamNeedId: string, newStatus: 'pending' | 'in_progress' | 'resolved' | 'cancelled') => {
    if (!productionLine?.id) {
      console.error("⛔ Cannot update team need status: production line ID is missing");
      toast({
        title: "Error",
        description: "Cannot update status: production line information is missing",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`🔄 Updating team need ${teamNeedId} status to ${newStatus} for production line ${productionLine.id}`);
    setIsStatusUpdating(true);
    
    try {
      // Use apiPatch from our API utilities for consistent error handling
      const url = `/api/manufacturing/team-analytics/production-lines/${productionLine.id}/team-needs/${teamNeedId}`;
      console.log(`🔄 Making API request to: ${url}`);
      
      const response = await apiPatch(url, { 
        status: newStatus,
        productionLineId: productionLine.id // Explicitly include productionLineId in body
      });

      console.log("✅ Team need status updated successfully:", response);
      
      // More systematic approach to cache invalidation
      console.log("🔄 Starting cache invalidation sequence");
      
      // First, remove specific cached items
      const teamNeedsQueryKey = `/api/manufacturing/team-analytics/production-lines/${productionLine.id}/team-needs`;
      console.log(`🔄 Removing specific query cache: ${teamNeedsQueryKey}`);
      queryClient.removeQueries({ queryKey: [teamNeedsQueryKey] });
      
      // Then invalidate parent queries
      console.log(`🔄 Invalidating production lines query`);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/production-lines'],
        exact: false // This ensures it invalidates all nested queries too
      });
      
      // Force an immediate refetch of the key queries
      console.log(`🔄 Forcing refetch of production lines data`);
      await queryClient.refetchQueries({ 
        queryKey: ['/api/manufacturing/production-lines'],
        type: 'active' // Only refetch queries that are currently rendered
      });
      
      toast({
        title: "Success",
        description: `Team need status updated to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error: any) {
      console.error("⛔ Error updating team need status:", error);
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
      {productionLine?.id && (
        <TeamNeedDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          productionLineId={productionLine.id}
          projects={projects}
          onSave={handleRefresh}
        />
      )}

      {/* Edit Team Need Dialog */}
      {selectedTeamNeed && productionLine?.id && (
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