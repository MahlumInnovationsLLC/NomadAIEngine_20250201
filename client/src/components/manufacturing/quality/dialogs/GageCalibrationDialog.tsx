import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSpinner, faCertificate, faTimes, faCheck } from '@fortawesome/pro-light-svg-icons';
import { Gage, CalibrationRecord, defaultCalibrationRecord } from "@/types/manufacturing/gage";
import { format } from "date-fns";

interface GageCalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gage?: Gage;
  gageId?: string;
  onSuccess: () => void;
}

// Validation schema for calibration record
const calibrationFormSchema = z.object({
  date: z.date({
    required_error: "Calibration date is required",
  }),
  result: z.enum(["pass", "conditional", "fail"], {
    required_error: "Result is required",
  }),
  performedBy: z.string().min(1, "Performed by is required"),
  certificationNumber: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.date({
    required_error: "Next due date is required",
  }),
});

type CalibrationFormValues = z.infer<typeof calibrationFormSchema>;

export function GageCalibrationDialog({ open, onOpenChange, gage, gageId, onSuccess }: GageCalibrationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const id = gage?.id || gageId || "";

  // Initialize form with default values
  const form = useForm<CalibrationFormValues>({
    resolver: zodResolver(calibrationFormSchema),
    defaultValues: {
      date: new Date(),
      result: "pass",
      performedBy: "",
      certificationNumber: "",
      notes: "",
      nextDueDate: gage?.nextCalibrationDate 
        ? new Date(gage.nextCalibrationDate) 
        : new Date(Date.now() + (gage?.calibrationFrequency || 365) * 24 * 60 * 60 * 1000),
    },
  });

  // Handle form submission
  const onSubmit = async (data: CalibrationFormValues) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      const calibrationRecord: Omit<CalibrationRecord, "id"> = {
        date: format(data.date, "yyyy-MM-dd"),
        result: data.result,
        performedBy: data.performedBy,
        certificationNumber: data.certificationNumber || "",
        notes: data.notes || "",
        nextCalibrationDate: format(data.nextDueDate, "yyyy-MM-dd"),
      };

      const response = await fetch(`/api/manufacturing/quality/gages/${id}/calibration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calibrationRecord),
      });

      if (!response.ok) {
        throw new Error("Failed to add calibration record");
      }

      onSuccess();
    } catch (error) {
      console.error("Error adding calibration record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate next due date based on current date and calibration frequency
  const calculateNextDueDate = (date: Date) => {
    const nextDueDate = new Date(date);
    nextDueDate.setDate(nextDueDate.getDate() + (gage?.calibrationFrequency || 365));
    form.setValue("nextDueDate", nextDueDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Calibration Record</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Calibration Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      onDateChange={(date) => {
                        field.onChange(date);
                        if (date) {
                          calculateNextDueDate(date);
                        }
                      }}
                    />
                    <FormDescription>
                      Date when the calibration was performed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pass">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4 text-success" />
                            <span>Pass</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="conditional">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4 text-warning" />
                            <span>Conditional</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fail">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4 text-destructive" />
                            <span>Fail</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Calibration outcome
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performed By</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Person or organization who performed the calibration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter certification number (optional)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Reference number for calibration certificate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Due Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      onDateChange={(date) => {
                        field.onChange(date);
                      }}
                    />
                    <FormDescription>
                      When the next calibration is required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes (optional)"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional information about the calibration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCertificate} className="mr-2 h-4 w-4" />
                      Save Calibration
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}