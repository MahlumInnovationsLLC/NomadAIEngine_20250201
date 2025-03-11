import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  requiresApproval?: boolean;
  requiresComment?: boolean;
  requiresReason?: boolean;
  reasons?: string[];
  fieldValidation?: {
    [field: string]: {
      required?: boolean;
      message?: string;
    };
  };
  confirmationMessage?: string;
}

interface WorkflowStatusTransitionProps {
  // Current item data
  currentStatus: string;
  itemId: string;
  itemTypeLabel: string;
  
  // Workflow setup
  transitions: WorkflowTransition[];
  statusColors: Record<string, string>;
  
  // Form fields that might be required for certain transitions
  formFields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'file';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    validation?: {
      required?: boolean;
      min?: number;
      max?: number;
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
  }>;
  
  // Handlers
  onTransitionStart?: (transition: WorkflowTransition) => void;
  onTransitionComplete: (newStatus: string, data: any) => Promise<void>;
  onTransitionCancel?: () => void;
}

export function WorkflowStatusTransition({
  currentStatus,
  itemId,
  itemTypeLabel,
  transitions,
  statusColors,
  formFields = [],
  onTransitionStart,
  onTransitionComplete,
  onTransitionCancel,
}: WorkflowStatusTransitionProps) {
  const { toast } = useToast();
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const availableTransitions = transitions.filter(
    (transition) => transition.from === currentStatus
  );

  // Build dynamic form schema based on transition requirements
  const buildFormSchema = (transition: WorkflowTransition) => {
    const schemaFields: Record<string, any> = {};

    if (transition.requiresComment) {
      schemaFields.comment = z.string().min(1, "Comment is required");
    }

    if (transition.requiresReason) {
      schemaFields.reason = z.string().min(1, "Reason is required");
    }

    // Add validation for required fields
    if (transition.fieldValidation) {
      Object.entries(transition.fieldValidation).forEach(([field, validation]) => {
        if (validation.required) {
          schemaFields[field] = z.string().min(1, validation.message || `${field} is required`);
        }
      });
    }

    // Process custom form fields
    formFields.forEach((field) => {
      if (transition.fieldValidation?.[field.name]?.required) {
        let fieldSchema = z.string();
        
        if (field.validation?.required || transition.fieldValidation?.[field.name]?.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        }
        
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength, 
            `${field.label} must be at least ${field.validation.minLength} characters`);
        }
        
        if (field.validation?.maxLength) {
          fieldSchema = fieldSchema.max(field.validation.maxLength, 
            `${field.label} must be at most ${field.validation.maxLength} characters`);
        }
        
        schemaFields[field.name] = fieldSchema;
      }
    });

    return z.object(schemaFields);
  };

  const handleTransitionStart = (transition: WorkflowTransition) => {
    setSelectedTransition(transition);
    
    if (onTransitionStart) {
      onTransitionStart(transition);
    }

    if (transition.requiresApproval || 
        transition.requiresComment || 
        transition.requiresReason ||
        Object.keys(transition.fieldValidation || {}).length > 0) {
      setShowTransitionForm(true);
    } else if (transition.confirmationMessage) {
      setShowConfirmDialog(true);
    } else {
      handleTransitionConfirm(transition, {});
    }
  };

  const handleTransitionConfirm = async (transition: WorkflowTransition, data: any) => {
    try {
      setIsProcessing(true);
      await onTransitionComplete(transition.to, {
        ...data,
        fromStatus: transition.from,
        toStatus: transition.to,
        transitionDate: new Date().toISOString(),
      });

      toast({
        title: "Status Updated",
        description: `${itemTypeLabel} has been moved to "${transition.to}".`,
      });

      resetDialogs();
    } catch (error) {
      console.error("Error during status transition:", error);
      toast({
        title: "Transition Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialogs = () => {
    setSelectedTransition(null);
    setShowConfirmDialog(false);
    setShowTransitionForm(false);
  };

  // Build the form based on transition requirements
  const TransitionForm = ({ transition }: { transition: WorkflowTransition }) => {
    const schema = buildFormSchema(transition);
    
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        comment: "",
        reason: "",
      },
    });

    return (
      <Dialog open={showTransitionForm} onOpenChange={setShowTransitionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transition.label}</DialogTitle>
            <DialogDescription>
              {transition.description || `Change status from "${transition.from}" to "${transition.to}"`}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit((data) => handleTransitionConfirm(transition, data))} 
              className="space-y-4"
            >
              {transition.requiresReason && transition.reasons && transition.reasons.length > 0 && (
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {transition.reasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {transition.requiresReason && (!transition.reasons || transition.reasons.length === 0) && (
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reason" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {transition.requiresComment && (
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a comment about this status change"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Render custom form fields with validation */}
              {formFields.map((fieldConfig) => {
                if (transition.fieldValidation?.[fieldConfig.name]) {
                  return (
                    <FormField
                      key={fieldConfig.name}
                      control={form.control}
                      name={fieldConfig.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{fieldConfig.label}</FormLabel>
                          <FormControl>
                            {fieldConfig.type === 'textarea' ? (
                              <Textarea 
                                placeholder={fieldConfig.placeholder} 
                                {...field} 
                              />
                            ) : fieldConfig.type === 'select' && fieldConfig.options ? (
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldConfig.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input 
                                type={fieldConfig.type} 
                                placeholder={fieldConfig.placeholder} 
                                {...field} 
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                }
                return null;
              })}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTransitionForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Confirm"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status] || "default";
  };

  return (
    <div>
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge variant={getStatusBadgeVariant(currentStatus)}>
            {currentStatus}
          </Badge>
        </div>

        {availableTransitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((transition) => (
              <Button
                key={`${transition.from}-${transition.to}`}
                variant="outline"
                size="sm"
                disabled={isProcessing}
                onClick={() => handleTransitionStart(transition)}
              >
                {transition.icon && (
                  <FontAwesomeIcon 
                    icon={transition.icon} 
                    className="mr-2 h-4 w-4" 
                  />
                )}
                {transition.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {selectedTransition && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedTransition.label}</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedTransition.confirmationMessage || 
                  `Are you sure you want to change the status from "${selectedTransition.from}" to "${selectedTransition.to}"?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                disabled={isProcessing}
                onClick={(e) => {
                  e.preventDefault();
                  handleTransitionConfirm(selectedTransition, {});
                }}
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Form Dialog for transitions requiring additional data */}
      {selectedTransition && <TransitionForm transition={selectedTransition} />}
    </div>
  );
}