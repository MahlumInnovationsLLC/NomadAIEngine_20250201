import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { QualityInspection } from "@/types/manufacturing";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface NonConformanceReport {
  id?: string;
  title: string;
  description: string;
  type: "product" | "process" | "material" | "documentation";
  severity: "minor" | "major" | "critical";
  area: string;
  productLine?: string;
  lotNumber?: string;
  quantityAffected?: number;
  disposition:
    | "use_as_is"
    | "rework"
    | "repair"
    | "scrap"
    | "return_to_supplier"
    | "pending";
  containmentActions: {
    action: string;
    assignedTo: string;
    dueDate: string;
  }[];
  status: "open" | "closed" | "under_review" | "pending_disposition";
  inspectionId?: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  reportedBy: string;
  attachments?: {
    id: string;
    fileName: string;
    fileSize: number;
    blobUrl: string;
  }[];
  projectNumber?: string;
}

const ncrFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["product", "process", "material", "documentation"]),
  severity: z.enum(["minor", "major", "critical"]),
  area: z.string().min(1, "Area is required"),
  productLine: z.string().optional(),
  lotNumber: z.string().optional(),
  quantityAffected: z.number().optional(),
  disposition: z.enum([
    "use_as_is",
    "rework",
    "repair",
    "scrap",
    "return_to_supplier",
    "pending",
  ]),
  status: z.enum(["open", "closed", "under_review", "pending_disposition"]),
  containmentActions: z.array(
    z.object({
      action: z.string(),
      assignedTo: z.string(),
      dueDate: z.string(),
    })
  ),
  projectNumber: z.string().optional(),
});

interface NCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection?: QualityInspection;
  defaultValues?: Partial<NonConformanceReport>;
  onSuccess?: () => void;
}

export function NCRDialog({ open, onOpenChange, inspection, defaultValues, onSuccess }: NCRDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!defaultValues?.id;
  const [uploadingFile, setUploadingFile] = useState(false);

  const form = useForm<z.infer<typeof ncrFormSchema>>({
    resolver: zodResolver(ncrFormSchema),
    defaultValues: defaultValues || {
      title: inspection ? `NCR: ${inspection.templateType} - ${inspection.productionLineId}` : "",
      description: inspection?.results.defectsFound.map(d => 
        `${d.severity.toUpperCase()}: ${d.description}`
      ).join('\n') || "",
      type: "product",
      severity: inspection?.results.defectsFound.some(d => d.severity === 'critical') ? 'critical' :
               inspection?.results.defectsFound.some(d => d.severity === 'major') ? 'major' : 'minor',
      area: inspection?.productionLineId || "",
      productLine: inspection?.productionLineId || "",
      disposition: "pending",
      status: "open",
      containmentActions: [
        {
          action: "",
          assignedTo: "",
          dueDate: new Date().toISOString().split("T")[0],
        },
      ],
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    // Add userKey for Cosmos DB partitioning
    formData.append('userKey', 'default');
    formData.append('uploadedBy', 'system');

    try {
      setUploadingFile(true);
      const response = await fetch(`/api/manufacturing/quality/ncrs/${defaultValues?.id}/attachments`, {
        method: 'POST',
        body: formData,
        // Important: Don't set Content-Type header, let the browser set it with the boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof ncrFormSchema>) => {
    try {
      const ncrData = {
        ...values,
        inspectionId: inspection?.id,
        updatedAt: new Date().toISOString(),
        ...(isEditing ? {} : {
          number: `NCR-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          reportedBy: "Current User",
        })
      };
  
      console.log('Submitting NCR data:', ncrData);
  
      const response = await fetch(`/api/manufacturing/quality/ncrs${isEditing ? `/${defaultValues.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncrData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} NCR`);
      }
  
      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
  
      if (onSuccess) {
        onSuccess();
      } else {
        toast({
          title: "Success",
          description: `NCR ${isEditing ? 'updated' : 'created'} successfully`,
        });
      }
  
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} NCR:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} NCR`,
        variant: "destructive",
      });
    }
  };

  const addContainmentAction = () => {
    const currentActions = form.getValues("containmentActions");
    form.setValue("containmentActions", [
      ...currentActions,
      {
        action: "",
        assignedTo: "",
        dueDate: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const removeContainmentAction = (index: number) => {
    const currentActions = form.getValues("containmentActions");
    form.setValue(
      "containmentActions",
      currentActions.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Non-Conformance Report</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify the NCR details' : 'Create a new NCR based on the inspection findings'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(85vh-130px)]">
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 space-y-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter NCR title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Describe the non-conformance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="pending_disposition">Pending Disposition</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disposition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disposition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select disposition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="use_as_is">Use As Is</SelectItem>
                            <SelectItem value="rework">Rework</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="scrap">Scrap</SelectItem>
                            <SelectItem value="return_to_supplier">Return to Supplier</SelectItem>
                            <SelectItem value="pending">Pending Decision</SelectItem>
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
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter affected area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productLine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Line</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product line" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                    <FormField
                      control={form.control}
                      name="projectNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project number" {...field} />
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
                          <Input placeholder="Enter lot number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantityAffected"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity Affected</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter quantity"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Containment Actions</h4>
                    <Button type="button" variant="outline" onClick={addContainmentAction}>
                      <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                      Add Action
                    </Button>
                  </div>

                  {form.watch("containmentActions").map((_, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`containmentActions.${index}.action`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Action description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`containmentActions.${index}.assignedTo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Assigned to" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name={`containmentActions.${index}.dueDate`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContainmentAction(index)}
                        >
                          <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Attachments</h4>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="w-[200px]"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        {uploadingFile && (
                          <div className="animate-spin">
                            <FontAwesomeIcon icon="spinner" className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    {defaultValues?.attachments && defaultValues.attachments.length > 0 && (
                      <div className="space-y-2">
                        {defaultValues.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="file" className="h-4 w-4" />
                              <span>{attachment.fileName}</span>
                              <span className="text-sm text-muted-foreground">
                                ({Math.round(attachment.fileSize / 1024)} KB)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.blobUrl, '_blank')}
                              >
                                <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-none p-6 bg-background border-t mt-auto">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? 'Update' : 'Create'} NCR</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}