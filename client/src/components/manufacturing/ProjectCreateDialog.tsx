import { useState, useEffect } from "react";
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
  team: z.string().optional(),
  contractDate: z.string().optional(),
  dpasRating: z.string().optional(),
  chassisEta: z.string().optional(),
  stretchShortenGears: z.enum(["N/A", "Stretch", "Shorten", "Gears"]).optional(),
  paymentMilestones: z.string().optional(),
  lltsOrdered: z.string().optional(),
  meAssigned: z.string().optional(),
  meCadProgress: z.number().min(0).max(100).optional(),
  eeAssigned: z.string().optional(),
  eeDesignProgress: z.number().min(0).max(100).optional(),
  itAssigned: z.string().optional(),
  itDesignProgress: z.number().min(0).max(100).optional(),
  ntcAssigned: z.string().optional(),
  ntcDesignProgress: z.number().min(0).max(100).optional(),
  fabricationStart: z.string().optional(),
  assemblyStart: z.string().optional(),
  wrapGraphics: z.string().optional(),
  ntcTesting: z.string().optional(),
  qcStart: z.string().optional(),
  qcDays: z.string().optional(),
  executiveReview: z.string().optional(),
  ship: z.string().optional(),
  delivery: z.string().optional()
});

type ProjectFormValues = z.infer<typeof projectSchema>;

function getBusinessDays(startDate: Date, endDate: Date): number {
  const holidays = [
    '2025-01-01',
    '2025-01-20',
    '2025-02-17',
    '2025-05-26',
    '2025-07-04',
    '2025-09-01',
    '2025-11-27',
    '2025-11-28',
    '2025-12-25',
  ];

  let count = 0;
  const curDate = new Date(startDate.getTime());
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    const dateString = curDate.toISOString().split('T')[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateString)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

function getQCDaysColor(days: number): string {
  if (days < 2) return "text-red-500";
  if (days < 4) return "text-yellow-500";
  return "text-green-500";
}

export function ProjectCreateDialog() {
  const [open, setOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      meCadProgress: 0,
      eeDesignProgress: 0,
      itDesignProgress: 0,
      ntcDesignProgress: 0,
      stretchShortenGears: "N/A"
    }
  });

  const qcStart = form.watch("qcStart");
  const executiveReview = form.watch("executiveReview");
  const qcDays = form.watch("qcDays");

  useEffect(() => {
    if (qcStart && executiveReview) {
      const startDate = new Date(qcStart);
      const endDate = new Date(executiveReview.split('T')[0]);
      const days = getBusinessDays(startDate, endDate);
      form.setValue("qcDays", days.toString());
    }
  }, [qcStart, executiveReview, form]);

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

  const hasEmptyFields = (data: ProjectFormValues) => {
    return Object.entries(data).some(([key, value]) => {
      if (key === 'projectNumber' || key === 'location') return false;
      return value === undefined || value === '' || value === null;
    });
  };

  function onSubmit(data: ProjectFormValues) {
    if (hasEmptyFields(data)) {
      setShowWarning(true);
    } else {
      createProjectMutation.mutate(data);
    }
  }

  return (
    <>
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
                      <FormLabel>Project # *</FormLabel>
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
                      <FormLabel>Location *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="N/A">N/A</SelectItem>
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
                        <SelectItem value="N/A">N/A</SelectItem>
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
                  name="itAssigned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IT Assigned</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                  name="ntcAssigned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NTC Assigned</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input 
                          {...field} 
                          disabled 
                          className={getQCDaysColor(parseInt(field.value || "0"))}
                        />
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
                        <Input type="datetime-local" {...field} />
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

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Fields Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Some fields are empty. Would you like to continue creating the project with empty fields?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowWarning(false);
              createProjectMutation.mutate(form.getValues());
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}