import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, generateUUID } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { CalendarIcon, Plus, Trash } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from '@fortawesome/pro-light-svg-icons';
import { z } from "zod";
import { CalibrationRecord, CalibrationRecordSchema } from "@/types/manufacturing/gage";

interface GageCalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gageId: string;
  onSuccess: () => void;
}

const measurementSchema = z.object({
  parameter: z.string().min(1, "Parameter is required"),
  nominal: z.number(),
  tolerance: z.number(),
  actual: z.number(),
  unit: z.string().min(1, "Unit is required"),
  result: z.enum(["pass", "fail"]),
});

type Measurement = z.infer<typeof measurementSchema>;

export function GageCalibrationDialog({ open, onOpenChange, gageId, onSuccess }: GageCalibrationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([
    {
      parameter: "",
      nominal: 0,
      tolerance: 0,
      actual: 0,
      unit: "mm",
      result: "pass"
    }
  ]);

  const form = useForm<CalibrationRecord>({
    resolver: zodResolver(CalibrationRecordSchema),
    defaultValues: {
      id: generateUUID(),
      date: new Date().toISOString(),
      performedBy: "",
      result: "pass",
      nextCalibrationDate: addDays(new Date(), 365).toISOString(),
      measurements: [],
      notes: ""
    },
  });

  const addMeasurement = () => {
    setMeasurements([
      ...measurements,
      {
        parameter: "",
        nominal: 0,
        tolerance: 0,
        actual: 0,
        unit: "mm",
        result: "pass"
      }
    ]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const updateMeasurement = (index: number, field: keyof Measurement, value: any) => {
    const updatedMeasurements = [...measurements];
    updatedMeasurements[index] = {
      ...updatedMeasurements[index],
      [field]: field === 'nominal' || field === 'tolerance' || field === 'actual' 
        ? parseFloat(value) 
        : value
    };
    
    // Auto-calculate result based on actual value, nominal, and tolerance
    if (field === 'actual' || field === 'nominal' || field === 'tolerance') {
      const { nominal, tolerance, actual } = updatedMeasurements[index];
      updatedMeasurements[index].result = 
        (actual <= (nominal + tolerance) && actual >= (nominal - tolerance)) 
          ? 'pass' 
          : 'fail';
    }
    
    setMeasurements(updatedMeasurements);
  };

  const onSubmit = async (data: CalibrationRecord) => {
    setIsSubmitting(true);
    try {
      // Add measurements to the form data
      const completeData = {
        ...data,
        measurements
      };

      const response = await fetch(
        `/api/manufacturing/quality/gages/${gageId}/calibration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add calibration record');
      }

      onSuccess();
    } catch (error) {
      console.error('Error adding calibration record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Calibration Record</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Calibration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString() ?? '')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      <Input {...field} placeholder="Enter name or ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="conditional">Conditional Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextCalibrationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Calibration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString() ?? '')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="certificationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Number</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Measurements</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addMeasurement}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Measurement
                </Button>
              </div>

              <div className="space-y-3">
                {measurements.map((measurement, index) => (
                  <div key={index} className="border rounded-md p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Measurement {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMeasurement(index)}
                        disabled={measurements.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <FormLabel htmlFor={`param-${index}`}>Parameter</FormLabel>
                        <Input
                          id={`param-${index}`}
                          value={measurement.parameter}
                          onChange={(e) => updateMeasurement(index, 'parameter', e.target.value)}
                          placeholder="e.g., Diameter, Length"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel htmlFor={`unit-${index}`}>Unit</FormLabel>
                        <Select
                          value={measurement.unit}
                          onValueChange={(value) => updateMeasurement(index, 'unit', value)}
                        >
                          <SelectTrigger id={`unit-${index}`}>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mm">mm</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="in">in</SelectItem>
                            <SelectItem value="ft">ft</SelectItem>
                            <SelectItem value="deg">deg</SelectItem>
                            <SelectItem value="rad">rad</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                            <SelectItem value="lbf">lbf</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <FormLabel htmlFor={`nominal-${index}`}>Nominal</FormLabel>
                        <Input
                          id={`nominal-${index}`}
                          type="number"
                          step="0.001"
                          value={measurement.nominal}
                          onChange={(e) => updateMeasurement(index, 'nominal', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel htmlFor={`tolerance-${index}`}>Tolerance</FormLabel>
                        <Input
                          id={`tolerance-${index}`}
                          type="number"
                          step="0.001"
                          value={measurement.tolerance}
                          onChange={(e) => updateMeasurement(index, 'tolerance', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel htmlFor={`actual-${index}`}>Actual</FormLabel>
                        <Input
                          id={`actual-${index}`}
                          type="number"
                          step="0.001"
                          value={measurement.actual}
                          onChange={(e) => updateMeasurement(index, 'actual', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FormLabel htmlFor={`result-${index}`}>Result</FormLabel>
                      <Select
                        value={measurement.result}
                        onValueChange={(value) => updateMeasurement(index, 'result', value)}
                      >
                        <SelectTrigger id={`result-${index}`}>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-2">
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
                  "Save Calibration Record"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}