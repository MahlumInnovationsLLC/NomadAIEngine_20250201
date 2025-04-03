import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useRedline, RedlineSubmission } from "./RedlineContext";

// Define the schema for redline submission form
const redlineFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  projectNumber: z.string({
    required_error: "Please select a project number.",
  }),
  requestor: z.string().min(2, {
    message: "Requestor name must be at least 2 characters.",
  }),
  department: z.string({
    required_error: "Please select an engineering department.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  priority: z.string({
    required_error: "Please select a priority level.",
  }),
  attachmentName: z.string().optional(),
});

interface DepartmentRedlinePanelProps {
  department: "Electrical" | "Mechanical" | "IT" | "NTC";
}

export default function DepartmentRedlinePanel({ department }: DepartmentRedlinePanelProps) {
  const {
    redlineSubmissions,
    findRedlinesByDepartment,
    selectedSubmission,
    setSelectedSubmission,
    isSubmitDialogOpen,
    setIsSubmitDialogOpen,
    isViewDialogOpen,
    setIsViewDialogOpen,
    isCommentDialogOpen,
    setIsCommentDialogOpen,
    updateRedlineSubmission,
    addRedlineSubmission
  } = useRedline();
  
  const [fileInput, setFileInput] = useState<File | null>(null);

  // Get filtered redline submissions for this department
  const departmentRedlines = findRedlinesByDepartment(department);

  // Handler for viewing redline submission
  const handleViewRedline = (submission: RedlineSubmission) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
  };

  // Handler for editing redline submission
  const handleEditRedline = (submission: RedlineSubmission) => {
    setSelectedSubmission(submission);
    setIsSubmitDialogOpen(true);
  };

  // Handler for commenting on redline submission
  const handleCommentRedline = (submission: RedlineSubmission) => {
    setSelectedSubmission(submission);
    setIsCommentDialogOpen(true);
  };

  // Status badge variant lookup
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "In Review":
        return "default";
      case "Approved":
        return "success";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Priority badge variant lookup
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Setup form with validation
  const form = useForm<z.infer<typeof redlineFormSchema>>({
    resolver: zodResolver(redlineFormSchema),
    defaultValues: {
      title: selectedSubmission?.title || "",
      projectNumber: selectedSubmission?.projectNumber || "",
      requestor: selectedSubmission?.requestor || "",
      department: selectedSubmission?.department || department,
      description: selectedSubmission?.description || "",
      priority: selectedSubmission?.priority || "",
      attachmentName: selectedSubmission?.attachments?.[0]?.fileName || "",
    },
  });

  // Effect to update form when selected submission changes
  useEffect(() => {
    if (selectedSubmission) {
      form.reset({
        title: selectedSubmission.title,
        projectNumber: selectedSubmission.projectNumber,
        requestor: selectedSubmission.requestor,
        department: selectedSubmission.department,
        description: selectedSubmission.description,
        priority: selectedSubmission.priority,
        attachmentName: selectedSubmission.attachments?.[0]?.fileName || "",
      });
    } else {
      form.reset({
        title: "",
        projectNumber: "",
        requestor: "",
        department,
        description: "",
        priority: "",
        attachmentName: "",
      });
    }
  }, [selectedSubmission, form, department]);

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileInput(file);
      form.setValue("attachmentName", file.name);
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof redlineFormSchema>) => {
    // Check if we're editing or creating new
    if (selectedSubmission) {
      // Update existing submission
      updateRedlineSubmission(selectedSubmission.id, {
        ...values,
        attachments: fileInput ? [{
          fileName: values.attachmentName || fileInput.name,
          fileType: fileInput.type,
          fileSize: `${Math.round(fileInput.size / 1024)} KB`,
          filePath: URL.createObjectURL(fileInput)
        }] : selectedSubmission.attachments
      });
      
      toast({
        title: "Redline updated successfully",
        description: "Your changes have been saved.",
      });
    } else {
      // Generate a new ID for the submission
      const newId = `RED-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      // Create new submission
      addRedlineSubmission({
        id: newId,
        title: values.title,
        projectNumber: values.projectNumber,
        requestor: values.requestor,
        department: values.department,
        submittedBy: "Current User", // This would be the logged-in user
        submittedDate: new Date().toISOString().split('T')[0], // Today's date
        status: "Pending",
        priority: values.priority,
        assignedTo: "", // Would be assigned later
        description: values.description,
        attachments: fileInput ? [{
          fileName: values.attachmentName || fileInput.name,
          fileType: fileInput.type,
          fileSize: `${Math.round(fileInput.size / 1024)} KB`,
          filePath: URL.createObjectURL(fileInput)
        }] : []
      });
      
      toast({
        title: "Redline submitted successfully",
        description: "Your request has been sent to the engineering department.",
      });
    }

    setIsSubmitDialogOpen(false);
    setSelectedSubmission(null);
    form.reset();
    setFileInput(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{department} Department Redlines</CardTitle>
              <CardDescription>
                Manage redline submissions for {department} engineering
              </CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedSubmission(null);
              setIsSubmitDialogOpen(true);
            }}>
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              New Redline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {departmentRedlines.length === 0 ? (
            <div className="text-center py-6">
              <FontAwesomeIcon icon="clipboard-list" className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">No redline submissions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There are currently no redline submissions for the {department} department.
              </p>
              <Button onClick={() => setIsSubmitDialogOpen(true)}>
                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                Create Redline Submission
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentRedlines.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.id}</TableCell>
                    <TableCell>{submission.title}</TableCell>
                    <TableCell>{submission.projectNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(submission.status)}>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(submission.priority)}>
                        {submission.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{submission.submittedDate}</TableCell>
                    <TableCell>{submission.assignedTo}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewRedline(submission)}>
                            <FontAwesomeIcon icon="eye" className="h-4 w-4 mr-2" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditRedline(submission)}>
                            <FontAwesomeIcon icon="edit" className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCommentRedline(submission)}>
                            <FontAwesomeIcon icon="comment" className="h-4 w-4 mr-2" />
                            <span>Comment</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <FontAwesomeIcon icon="trash" className="h-4 w-4 mr-2" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}>
        {/* Redline Submit/Edit Dialog */}
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedSubmission ? "Edit Redline Submission" : "Submit Drawing Change Request"}</DialogTitle>
            <DialogDescription>
              {selectedSubmission 
                ? "Edit the details of your redline submission" 
                : "Upload marked drawings or CAD files with requested changes for engineering review."}
            </DialogDescription>
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
                      <Input placeholder="Brief description of the changes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Number</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRJ-2025-001">PRJ-2025-001</SelectItem>
                          <SelectItem value="PRJ-2025-002">PRJ-2025-002</SelectItem>
                          <SelectItem value="PRJ-2025-003">PRJ-2025-003</SelectItem>
                          <SelectItem value="PRJ-2025-004">PRJ-2025-004</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requestor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requestor</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Mechanical">Mechanical</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="NTC">NTC</SelectItem>
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
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
                      <Textarea 
                        placeholder="Detailed description of the changes required" 
                        className="h-24" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="attachmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachment</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachmentFile"
                        type="file"
                        accept=".pdf,.dwg,.dxf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Upload a file"
                          readOnly
                          value={field.value || ""}
                          onClick={() => document.getElementById('attachmentFile')?.click()}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('attachmentFile')?.click()}
                      >
                        <FontAwesomeIcon icon="upload" className="mr-2 h-4 w-4" />
                        Browse
                      </Button>
                    </div>
                    <FormDescription>
                      Upload marked drawings, CAD files, or PDFs for engineering review.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsSubmitDialogOpen(false);
                  setSelectedSubmission(null);
                  form.reset();
                  setFileInput(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedSubmission ? "Save Changes" : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}