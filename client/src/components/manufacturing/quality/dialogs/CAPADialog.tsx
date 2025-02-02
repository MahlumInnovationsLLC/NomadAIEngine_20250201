import { useState, useEffect } from "react";
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
import { CAPA, CAPASchema } from "@/types/manufacturing/capa";

const defaultValues: Partial<CAPA> = {
  title: "",
  description: "",
  priority: "medium",
  type: "corrective",
  rootCause: "",
  verificationMethod: "",
  department: "",
  area: "",
  categoryId: undefined,
  status: "draft",
  scheduledReviewDate: new Date().toISOString(),
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
        body: JSON.stringify(data),
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

  const onSubmit = async (data: CAPA) => {
    setIsSubmitting(true);
    try {
      await createCAPA.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit CAPA" : "Create CAPA"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
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
                      value={field.value}
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
            <FormField
              control={form.control}
              name="rootCause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Cause Analysis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed analysis of the root cause"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="verificationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Method</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="How will the effectiveness be verified?"
                      {...field}
                    />
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
                  <FormLabel>Area</FormLabel>
                  <FormControl>
                    <Input placeholder="Specific area" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
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