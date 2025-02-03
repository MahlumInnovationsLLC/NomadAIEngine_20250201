import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { SCAR, SCARSchema, defaultSCARAction } from "@/types/manufacturing/scar";

const defaultValues: Partial<SCAR> = {
  supplierName: "",
  issueDate: new Date().toISOString(),
  responseRequired: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  status: "draft",
  issue: {
    description: "",
    partNumbers: [],
    lotNumbers: [],
    occurrenceDate: new Date().toISOString(),
    category: "quality",
    severity: "minor",
  },
  containmentActions: [defaultSCARAction],
  correctiveActions: [defaultSCARAction],
  preventiveActions: [defaultSCARAction],
  verification: {
    method: "",
  },
  attachments: [],
};

interface SCARDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SCAR;
  onSuccess: () => void;
}

export function SCARDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: SCARDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SCAR>({
    resolver: zodResolver(SCARSchema),
    defaultValues: initialData || defaultValues,
  });

  const createSCAR = useMutation({
    mutationFn: async (data: SCAR) => {
      const response = await fetch(
        `/api/manufacturing/quality/scars${initialData ? `/${initialData.id}` : ''}`,
        {
          method: initialData ? 'PUT' : 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save SCAR');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/scars'] });
      onSuccess();
      onOpenChange(false);
    },
  });

  const renderActionSection = (
    title: string,
    description: string,
    actionType: 'containment' | 'corrective' | 'preventive',
    fieldArrayName: `${typeof actionType}Actions`
  ) => (
    <div className="space-y-4 border rounded-lg p-4 bg-background/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const currentActions = form.getValues(fieldArrayName);
            form.setValue(fieldArrayName, [...currentActions, defaultSCARAction]);
          }}
        >
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </div>

      {form.watch(fieldArrayName).map((_, index) => (
        <div key={index} className="space-y-4">
          <FormField
            control={form.control}
            name={`${fieldArrayName}.${index}.description` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Action description"
                    className="resize-none"
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
              name={`${fieldArrayName}.${index}.owner` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="Assign owner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${fieldArrayName}.${index}.dueDate` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value?.split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit SCAR" : "Create SCAR"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createSCAR.mutate)} className="space-y-4">
            <ScrollArea className="h-[80vh] px-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="supplierName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter supplier name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responseRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Response Required By</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value?.split('T')[0]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="issue.description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the quality issue"
                              className="resize-none"
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
                        name="issue.category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="quality">Quality</SelectItem>
                                <SelectItem value="delivery">Delivery</SelectItem>
                                <SelectItem value="documentation">Documentation</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issue.severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Containment Actions */}
                {renderActionSection(
                  "Containment Actions",
                  "Immediate actions to contain the issue and prevent further impact",
                  "containment",
                  "containmentActions"
                )}

                {/* Root Cause Analysis */}
                <div className="space-y-4 border rounded-lg p-4 bg-background/50">
                  <h3 className="font-semibold">Root Cause Analysis</h3>
                  <FormField
                    control={form.control}
                    name="rootCauseAnalysis.method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Analysis Method</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5 Why, Fishbone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rootCauseAnalysis.findings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Findings</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Document your root cause analysis findings"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Corrective Actions */}
                {renderActionSection(
                  "Corrective Actions",
                  "Actions to correct the root cause and prevent recurrence",
                  "corrective",
                  "correctiveActions"
                )}

                {/* Preventive Actions */}
                {renderActionSection(
                  "Preventive Actions",
                  "System-level changes to prevent similar issues",
                  "preventive",
                  "preventiveActions"
                )}

                {/* Verification */}
                <div className="space-y-4 border rounded-lg p-4 bg-background/50">
                  <h3 className="font-semibold">Verification</h3>
                  <FormField
                    control={form.control}
                    name="verification.method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Method</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How will the effectiveness be verified?"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
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
                    <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save SCAR'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
