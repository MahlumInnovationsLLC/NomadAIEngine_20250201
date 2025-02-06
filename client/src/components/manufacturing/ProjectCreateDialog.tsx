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
  location: z.string().optional(),
  team: z.string().nullable().optional(),
  contractDate: z.string().nullable().optional(),
  dpasRating: z.string().nullable().optional(),
  chassisEta: z.string().nullable().optional(),
  stretchShortenGears: z.enum(["N/A", "Stretch", "Shorten", "Gears"]).nullable().optional(),
  paymentMilestones: z.string().nullable().optional(),
  lltsOrdered: z.string().nullable().optional(),
  meAssigned: z.string().nullable().optional(),
  meCadProgress: z.number().min(0).max(100).nullable().optional(),
  eeAssigned: z.string().nullable().optional(),
  eeDesignProgress: z.number().min(0).max(100).nullable().optional(),
  itAssigned: z.string().nullable().optional(),
  itDesignProgress: z.number().min(0).max(100).nullable().optional(),
  ntcAssigned: z.string().nullable().optional(),
  ntcDesignProgress: z.number().min(0).max(100).nullable().optional(),
  fabricationStart: z.string().nullable().optional(),
  assemblyStart: z.string().nullable().optional(),
  wrapGraphics: z.string().nullable().optional(),
  ntcTesting: z.string().nullable().optional(),
  qcStart: z.string().nullable().optional(),
  qcDays: z.number().nullable().optional(),
  executiveReview: z.string().nullable().optional(),
  ship: z.string().nullable().optional(),
  delivery: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  ntcDays: z.number().nullable().optional()
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

interface ProjectCreateDialogProps {
  project?: Project;
  onClose?: () => void;
}

export function ProjectCreateDialog({ project, onClose }: ProjectCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectNumber: project?.projectNumber || '',
      location: project?.location || '',
      team: project?.team || '',
      contractDate: project?.contractDate || '',
      dpasRating: project?.dpasRating || '',
      chassisEta: project?.chassisEta || '',
      stretchShortenGears: project?.stretchShortenGears || 'N/A',
      paymentMilestones: project?.paymentMilestones || '',
      lltsOrdered: project?.lltsOrdered || '',
      meAssigned: project?.meAssigned || '',
      meCadProgress: project?.meCadProgress || 0,
      eeAssigned: project?.eeAssigned || '',
      eeDesignProgress: project?.eeDesignProgress || 0,
      itAssigned: project?.itAssigned || '',
      itDesignProgress: project?.itDesignProgress || 0,
      ntcAssigned: project?.ntcAssigned || '',
      ntcDesignProgress: project?.ntcDesignProgress || 0,
      fabricationStart: project?.fabricationStart || '',
      assemblyStart: project?.assemblyStart || '',
      wrapGraphics: project?.wrapGraphics || '',
      ntcTesting: project?.ntcTesting || '',
      qcStart: project?.qcStart || '',
      qcDays: project?.qcDays || null,
      executiveReview: project?.executiveReview || '',
      ship: project?.ship || '',
      delivery: project?.delivery || '',
      ntcDays: project?.ntcDays || null
    }
  });

    const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const qcStart = form.watch("qcStart");
  const executiveReview = form.watch("executiveReview");
  const ntcTesting = form.watch("ntcTesting");

  useEffect(() => {
    if (qcStart && executiveReview) {
      const startDate = new Date(qcStart);
      const endDate = new Date(executiveReview);
      const days = getBusinessDays(startDate, endDate);
      form.setValue("qcDays", days);
    }
    if (ntcTesting && qcStart) {
        const startDate = new Date(ntcTesting);
        const endDate = new Date(qcStart);
        const days = getBusinessDays(startDate, endDate);
        form.setValue("ntcDays", days);
    }
  }, [qcStart, executiveReview, ntcTesting, form]);

    const projectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const url = project
        ? `/api/manufacturing/projects/${project.id}`
        : '/api/manufacturing/projects';
      const method = project ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`Failed to ${project ? 'update' : 'create'} project`);
      return response.json();
    },
    onSuccess: (newProject) => {
      // Invalidate and refetch projects query
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });

      // Optimistically update the cache
      if (project) {
        queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
          if (!oldData) return [newProject];
          return oldData.map(p => p.id === project.id ? { ...p, ...newProject } : p);
        });
      }

      toast({
        title: "Success",
        description: `Project ${project ? 'updated' : 'created'} successfully`
      });
      handleClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${project ? 'update' : 'create'} project`,
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
        projectMutation.mutate(data);
    }
  }

  return (
    <>
      <Dialog open={open || !!project} onOpenChange={(value) => value ? setOpen(true) : handleClose()}>
        {!project && (
          <DialogTrigger asChild>
            <Button>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
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
                  name="ntcDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NTC Days</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
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
                <Button variant="outline" type="button" onClick={() => handleClose()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={projectMutation.isPending}>
                  {projectMutation.isPending && (
                    <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {project ? 'Update Project' : 'Create Project'}
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
                projectMutation.mutate(form.getValues());
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}