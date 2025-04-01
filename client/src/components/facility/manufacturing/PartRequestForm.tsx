import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

// Define the schema for part request validation
const partRequestSchema = z.object({
  partNumber: z.string()
    .min(3, { message: "Part number must be at least 3 characters" })
    .regex(/^[A-Z0-9-]+$/, { message: "Part number should only contain uppercase letters, numbers, and hyphens" }),
  partName: z.string().min(3, { message: "Part name is required" }),
  projectId: z.string().min(1, { message: "Project is required" }),
  requestedBy: z.string().min(3, { message: "Engineer name is required" }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  materialType: z.string().min(1, { message: "Material type is required" }),
  materialGrade: z.string().optional(),
  materialThickness: z.number().optional(),
  dimensions: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  description: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  notes: z.string().optional(),
  fabricationType: z.enum(["cnc", "welding", "laser", "bending"]),
  specificRequirements: z.string().optional(),
  qualityRequirements: z.string().optional(),
});

type PartRequestFormValues = z.infer<typeof partRequestSchema>;

interface PartRequestFormProps {
  fabricationType: "cnc" | "welding" | "laser" | "bending";
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary";
}

export default function PartRequestForm({ 
  fabricationType, 
  buttonText = "Request Part", 
  buttonVariant = "default" 
}: PartRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PartRequestFormValues>({
    resolver: zodResolver(partRequestSchema),
    defaultValues: {
      partNumber: "",
      partName: "",
      projectId: "",
      requestedBy: "",
      quantity: 1,
      materialType: "",
      priority: "medium",
      dueDate: new Date().toISOString().substring(0, 10),
      fabricationType: fabricationType,
    },
  });

  // Mutation to create a new part request
  const mutation = useMutation({
    mutationFn: async (values: PartRequestFormValues) => {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Append all form values to formData
      Object.entries(values).forEach(([key, value]) => {
        if (key !== 'attachments') {
          formData.append(key, value.toString());
        }
      });
      
      // Append files
      fileList.forEach((file) => {
        formData.append('attachments', file);
      });
      
      const response = await fetch(`/api/fabrication/${fabricationType}/part-request`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit part request');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fabrication/${fabricationType}/jobs`] });
      setOpen(false);
      toast({
        title: "Part Request Submitted",
        description: "Your part request has been successfully submitted.",
      });
      form.reset();
      setFileList([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit part request.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PartRequestFormValues) => {
    mutation.mutate(values);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFileList((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="part-request-dialog">
        <DialogHeader>
          <DialogTitle>New Part Request - {fabricationType.toUpperCase()}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="partName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Bracket Assembly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project *</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project1">Project Alpha</SelectItem>
                          <SelectItem value="project2">Project Beta</SelectItem>
                          <SelectItem value="project3">Project Gamma</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requestedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested By (Engineer) *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type *</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="steel">Steel</SelectItem>
                          <SelectItem value="aluminum">Aluminum</SelectItem>
                          <SelectItem value="stainless">Stainless Steel</SelectItem>
                          <SelectItem value="brass">Brass</SelectItem>
                          <SelectItem value="copper">Copper</SelectItem>
                          <SelectItem value="titanium">Titanium</SelectItem>
                          <SelectItem value="plastic">Plastic</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="materialGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A36, 6061-T6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="materialThickness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Thickness (mm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 100x50x25mm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Attachments (CAD Files, Drawings)</FormLabel>
                <div className="mt-1">
                  <Input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    accept=".dxf,.dwg,.step,.stp,.stl,.pdf"
                  />
                </div>
                {fileList.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {fileList.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-muted p-1 rounded">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFile(index)}
                        >
                          <FontAwesomeIcon icon="times" className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a detailed description of the part requirements"
                      className="h-20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specificRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Special manufacturing instructions or requirements"
                      className="h-20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualityRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Quality standards, tolerances, surface finish requirements"
                      className="h-20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information that might be helpful"
                      className="h-20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sticky bottom-0 pt-4 pb-2 bg-background">
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : "Submit Request"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}