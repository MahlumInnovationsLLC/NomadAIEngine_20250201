import { useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NonConformanceReport, NCRSchema } from "@/types/manufacturing/ncr";
import * as z from "zod";

interface NCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<NonConformanceReport>;
  onSuccess?: () => void;
  isEditing?: boolean;
}

export function NCRDialog({
  open,
  onOpenChange,
  defaultValues,
  onSuccess,
  isEditing = false,
}: NCRDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NonConformanceReport>({
    resolver: zodResolver(NCRSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      type: "product",
      severity: "minor",
      status: "draft",
      area: "",
      reportedBy: "",
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
    mutationFn: async (data: NonConformanceReport) => {
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
    mutationFn: async (data: { id: string; updates: Partial<NonConformanceReport> }) => {
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

  const onSubmit = async (data: NonConformanceReport) => {
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
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger value="details">Details & Classification</TabsTrigger>
                <TabsTrigger value="disposition">Disposition</TabsTrigger>
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
                        <FormControl>
                          <Input placeholder="Area where non-conformance occurred" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="Associated project number" {...field} />
                        </FormControl>
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
            </Tabs>

            <DialogFooter>
              <div className="flex gap-2 justify-between w-full">
                <div>
                  {activeTab !== "general" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (activeTab === "details") setActiveTab("general");
                        if (activeTab === "disposition") setActiveTab("details");
                      }}
                    >
                      <FontAwesomeIcon icon="arrow-left" className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  {activeTab !== "disposition" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (activeTab === "general") setActiveTab("details");
                        if (activeTab === "details") setActiveTab("disposition");
                      }}
                    >
                      Next
                      <FontAwesomeIcon icon="arrow-right" className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
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
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}