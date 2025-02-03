import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

const projectSchema = z.object({
  projectNumber: z.string().min(1, "Project number is required"),
  location: z.string().min(1, "Location is required"),
  team: z.string(),
  contractDate: z.string().min(1, "Contract date is required"),
  dpasRating: z.string(),
  chassisEta: z.string(),
  stretchShortenGears: z.enum(["Stretch", "Shorten", "Gears"]),
  paymentMilestones: z.string(),
  lltsOrdered: z.string(),
  meAssigned: z.string(),
  meCadProgress: z.number().min(0).max(100),
  eeAssigned: z.string(),
  eeDesignProgress: z.number().min(0).max(100),
  itDesignProgress: z.number().min(0).max(100),
  ntcDesignProgress: z.number().min(0).max(100),
  fabricationStart: z.string().min(1, "Fabrication start date is required"),
  assemblyStart: z.string().min(1, "Assembly start date is required"),
  wrapGraphics: z.string(),
  ntcTesting: z.string(),
  qcStart: z.string(),
  qcDays: z.string(),
  executiveReview: z.string(),
  ship: z.string(),
  delivery: z.string()
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectCreateDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      meCadProgress: 0,
      eeDesignProgress: 0,
      itDesignProgress: 0,
      ntcDesignProgress: 0,
      stretchShortenGears: "Gears"
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const response = await fetch('/api/manufacturing/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
      toast({ title: "Success", description: "Project created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive"
      });
    }
  });

  function onSubmit(data: ProjectFormValues) {
    createProjectMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Basic Info */}
              <FormField
                control={form.control}
                name="projectNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project #</FormLabel>
                    <FormControl>
                      <Input placeholder="8XXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Libby">Libby</SelectItem>
                        <SelectItem value="CFalls">CFalls</SelectItem>
                        <SelectItem value="FSW">FSW</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dpasRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DPAS Rating</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chassisEta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chassis ETA</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stretchShortenGears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stretch/Shorten/Gears</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Stretch">Stretch</SelectItem>
                        <SelectItem value="Shorten">Shorten</SelectItem>
                        <SelectItem value="Gears">Gears</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMilestones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Milestones</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lltsOrdered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LLTs Ordered</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Assignments */}
              <FormField
                control={form.control}
                name="meAssigned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ME Assigned</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meCadProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ME CAD %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eeAssigned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EE Assigned</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progress Percentages */}
              <FormField
                control={form.control}
                name="eeDesignProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EE Design/Orders %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itDesignProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IT Design/Orders %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ntcDesignProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NTC Design/Orders %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <FormField
                control={form.control}
                name="fabricationStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabrication Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assemblyStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assembly Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wrapGraphics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wrap/Graphics</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Final Stages */}
              <FormField
                control={form.control}
                name="ntcTesting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NTC Testing</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qcStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QC Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qcDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QC Days</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Final Fields */}
              <FormField
                control={form.control}
                name="executiveReview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Executive Review</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ship</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delivery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending && (
                  <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}