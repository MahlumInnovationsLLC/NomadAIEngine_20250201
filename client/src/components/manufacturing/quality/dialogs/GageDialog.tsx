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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, generateUUID } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from '@fortawesome/pro-light-svg-icons';
import { Gage, GageSchema, createDefaultGage } from "@/types/manufacturing/gage";

interface GageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Gage;
  onSuccess: (savedGage: Gage) => void;
}

export function GageDialog({ open, onOpenChange, initialData, onSuccess }: GageDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>(initialData?.attachments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<Gage>({
    resolver: zodResolver(GageSchema),
    defaultValues: initialData || createDefaultGage(),
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/manufacturing/quality/gages/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload attachments');
      }

      const uploadedFiles = await response.json();
      setUploadedAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
    }
  };

  const onSubmit = async (data: Gage) => {
    setIsSubmitting(true);
    try {
      // Add uploaded attachments to the form data
      const completeData = {
        ...data,
        attachments: uploadedAttachments,
      };

      const response = await fetch(
        isEditing 
          ? `/api/manufacturing/quality/gages/${data.id}` 
          : '/api/manufacturing/quality/gages',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} gage`);
      }

      const savedGage = await response.json();
      onSuccess(savedGage);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} gage:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Gage" : "Create New Gage"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="calibration">Calibration</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <TabsContent value="general" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gage Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serial Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem value="caliper">Caliper</SelectItem>
                                <SelectItem value="micrometer">Micrometer</SelectItem>
                                <SelectItem value="indicator">Indicator</SelectItem>
                                <SelectItem value="gage_block">Gage Block</SelectItem>
                                <SelectItem value="cmm">CMM</SelectItem>
                                <SelectItem value="height_gage">Height Gage</SelectItem>
                                <SelectItem value="thread_gage">Thread Gage</SelectItem>
                                <SelectItem value="pin_gage">Pin Gage</SelectItem>
                                <SelectItem value="bore_gage">Bore Gage</SelectItem>
                                <SelectItem value="depth_gage">Depth Gage</SelectItem>
                                <SelectItem value="surface_plate">Surface Plate</SelectItem>
                                <SelectItem value="optical_comparator">Optical Comparator</SelectItem>
                                <SelectItem value="scale">Scale</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
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
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="in_calibration">In Calibration</SelectItem>
                                <SelectItem value="out_of_service">Out of Service</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                                <SelectItem value="scrapped">Scrapped</SelectItem>
                                <SelectItem value="loaned_out">Loaned Out</SelectItem>
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
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
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
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="resolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resolution</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="range"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Range</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accuracy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accuracy</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="calibration" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="calibrationFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calibration Frequency (Days)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lastCalibrationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Last Calibration Date</FormLabel>
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
                        name="calibrationProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calibration Provider</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="calibrationProcedure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calibration Procedure</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="documentation" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="traceabilityNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Traceability Number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="text-md font-medium mb-4">Attachments</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-center border-2 border-dashed rounded-md p-4">
                          <label className="cursor-pointer text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Click to upload attachments or drag and drop
                            </p>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              onChange={(e) => handleFileUpload(e.target.files)}
                            />
                          </label>
                        </div>

                        <div className="space-y-2 mt-2">
                          {uploadedAttachments.map((attachment, index) => (
                            <div key={index} className="flex items-center p-2 rounded-md border">
                              <span className="flex-1 truncate">{attachment.fileName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="maintenance" className="space-y-4 mt-0">
                    <div className="p-4 rounded-md border bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Maintenance records can be added after creation on the gage details page.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>

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
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update" : "Create"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}