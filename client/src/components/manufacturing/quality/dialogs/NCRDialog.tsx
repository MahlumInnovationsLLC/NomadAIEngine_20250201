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

  // Rest of the code continues... (onSubmit, addContainmentAction, removeContainmentAction, return statement)
  // ... [Full original implementation of the remaining methods and return statement would be here]
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

  // Entire return statement and remaining code would be here as in the original file
  // To keep the response concise, I've shown the key modifications
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Original DialogContent and form implementation would follow */}
    </Dialog>
  );
}