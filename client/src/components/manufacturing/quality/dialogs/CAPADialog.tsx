import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAPA, CAPASchema, defaultEightDStep } from "@/types/manufacturing/capa";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const defaultValues: Partial<CAPA> = {
  title: "",
  description: "",
  priority: "medium",
  type: "corrective",
  category_id: undefined,
  status: "draft",
  scheduledReviewDate: new Date().toISOString(),
  department: "",
  area: "",

  // Initialize 8D steps
  d1_team: {
    ...defaultEightDStep,
    teamMembers: [],
  },
  d2_problem: defaultEightDStep,
  d3_containment: defaultEightDStep,
  d4_root_cause: defaultEightDStep,
  d5_corrective: defaultEightDStep,
  d6_implementation: defaultEightDStep,
  d7_preventive: defaultEightDStep,
  d8_recognition: defaultEightDStep,
};

interface CAPACategory {
  id: number;
  name: string;
  description: string | null;
  severity: string;
}

interface CAPADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<CAPA>;
  sourceNcrId?: string;
  sourceInspectionId?: string;
  onSuccess?: () => void;
}

const fetchCategories = async (): Promise<CAPACategory[]> => {
  const response = await fetch('/api/manufacturing/quality/capa-categories');
  if (!response.ok) {
    throw new Error('Failed to fetch CAPA categories');
  }
  return response.json();
};

export function CAPADialog({
  open,
  onOpenChange,
  initialData,
  sourceNcrId,
  sourceInspectionId,
  onSuccess,
}: CAPADialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useQuery<CAPACategory[]>({
    queryKey: ['/api/manufacturing/quality/capa-categories'],
    queryFn: fetchCategories,
  });

  const form = useForm<CAPA>({
    resolver: zodResolver(CAPASchema),
    defaultValues: {
      ...defaultValues,
      ...initialData,
      sourceNcrId,
      sourceInspectionId,
    },
  });

  const createCAPA = useMutation({
    mutationFn: async (data: CAPA) => {
      const response = await fetch("/api/manufacturing/quality/capas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id ? parseInt(data.category_id.toString()) : null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create CAPA");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "CAPA created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/quality/capas"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renderEightDStep = (
    stepNumber: number,
    title: string,
    description: string,
    fieldPrefix: keyof CAPA
  ) => (
    <div className="space-y-4 border rounded-lg p-4 bg-background/50">
      <div className="flex items-center gap-2">
        <Badge variant="outline">D{stepNumber}</Badge>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>

      <FormField
        control={form.control}
        name={`${fieldPrefix}.description` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder={`Enter D${stepNumber} details`}
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
          name={`${fieldPrefix}.owner` as any}
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
          name={`${fieldPrefix}.dueDate` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value?.split('T')[0]} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit CAPA" : "Create CAPA"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              createCAPA.mutate(data);
            })}
            className="space-y-4"
          >
            <ScrollArea className="h-[80vh] px-4">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="CAPA title" {...field} />
                          </FormControl>
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
                              placeholder="Detailed description of the issue and required actions"
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
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              value={field.value?.toString() || ""}
                              onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                  >
                                    {category.name}
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
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select
                              value={field.value || "medium"}
                              onValueChange={field.onChange}
                            >
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="corrective">Corrective</SelectItem>
                                <SelectItem value="preventive">Preventive</SelectItem>
                                <SelectItem value="improvement">Improvement</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Input placeholder="Department" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 8D Methodology Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">8D Problem Solving Methodology</h3>

                  {renderEightDStep(
                    1,
                    "Team Formation",
                    "Establish a cross-functional team with the knowledge and experience to solve the problem and implement corrective actions",
                    "d1_team"
                  )}

                  {renderEightDStep(
                    2,
                    "Problem Description",
                    "Specify the problem by identifying in quantifiable terms the who, what, when, where, why, how, and how many (5W2H) for the problem",
                    "d2_problem"
                  )}

                  {renderEightDStep(
                    3,
                    "Containment Actions",
                    "Define and implement containment actions to isolate the problem from any customer",
                    "d3_containment"
                  )}

                  {renderEightDStep(
                    4,
                    "Root Cause Analysis",
                    "Identify all applicable causes that could explain why the problem occurred. Also identify why the problem was not noticed at the time it occurred",
                    "d4_root_cause"
                  )}

                  {renderEightDStep(
                    5,
                    "Permanent Corrective Actions",
                    "Choose and verify corrective actions that will eliminate the root causes",
                    "d5_corrective"
                  )}

                  {renderEightDStep(
                    6,
                    "Implementation and Validation",
                    "Implement and validate corrective actions. Monitor long-term results and implement additional controls",
                    "d6_implementation"
                  )}

                  {renderEightDStep(
                    7,
                    "Preventive Actions",
                    "Modify management systems, operation systems, practices, and procedures to prevent recurrence of this and similar problems",
                    "d7_preventive"
                  )}

                  {renderEightDStep(
                    8,
                    "Team Recognition",
                    "Recognize the collective efforts of the team. Document the lessons learned",
                    "d8_recognition"
                  )}
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
                {isSubmitting ? "Saving..." : "Save CAPA"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}