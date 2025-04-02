import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Define the schema for redline submission form
const redlineFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
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

// Mock data for redline submissions (would be replaced with actual API data)
const mockRedlineSubmissions = [
  {
    id: "RED-001",
    title: "Update PCB Layout for Control Board",
    department: "Electrical",
    submittedBy: "John Smith",
    submittedDate: "2025-03-15",
    status: "Pending",
    priority: "High",
    assignedTo: "Elizabeth Parker"
  },
  {
    id: "RED-002",
    title: "Adjust Clearance in Mounting Bracket",
    department: "Mechanical",
    submittedBy: "Sarah Johnson",
    submittedDate: "2025-03-18",
    status: "In Review",
    priority: "Medium",
    assignedTo: "Robert Chen"
  },
  {
    id: "RED-003",
    title: "Update Network Topology Diagram",
    department: "IT",
    submittedBy: "Michael Brown",
    submittedDate: "2025-03-20",
    status: "Approved",
    priority: "Low",
    assignedTo: "David Garcia"
  },
  {
    id: "RED-004",
    title: "Modify API Interface Documentation",
    department: "NTC",
    submittedBy: "Jessica Lee",
    submittedDate: "2025-03-22",
    status: "Pending",
    priority: "High",
    assignedTo: "Alex Chen"
  },
];

export default function RedlineSubmissionPanel() {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [fileInput, setFileInput] = useState<File | null>(null);

  // Setup form with validation
  const form = useForm<z.infer<typeof redlineFormSchema>>({
    resolver: zodResolver(redlineFormSchema),
    defaultValues: {
      title: "",
      department: "",
      description: "",
      priority: "",
      attachmentName: "",
    },
  });

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
    // Here you would normally send the data to your API
    console.log("Form submitted:", values);
    console.log("File:", fileInput);

    // Show success toast and close dialog
    toast({
      title: "Redline submitted successfully",
      description: "Your request has been sent to the engineering department.",
    });

    setIsSubmitDialogOpen(false);
    form.reset();
    setFileInput(null);
  };

  // Handle view submission details
  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Redline Submissions</CardTitle>
              <CardDescription>
                Submit and track drawing package updates and CAD redlines
              </CardDescription>
            </div>
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  New Redline Submission
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Submit Drawing Change Request</DialogTitle>
                  <DialogDescription>
                    Upload marked drawings or CAD files with requested changes for engineering review.
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
                            <Input placeholder="Enter a descriptive title" {...field} />
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
                          <FormLabel>Engineering Department</FormLabel>
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
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Changes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the changes needed in detail..."
                              className="min-h-[120px]"
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
                        <FormItem className="space-y-1">
                          <FormLabel>Attachment</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                id="fileUpload"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.dwg,.dxf,.jpg,.png"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('fileUpload')?.click()}
                                className="h-10"
                              >
                                <FontAwesomeIcon icon="upload" className="mr-2 h-4 w-4" />
                                Upload File
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                {field.value || "No file selected"}
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload CAD files, PDFs, or images with marked changes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Submit Request</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRedlineSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.id}</TableCell>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>{submission.department}</TableCell>
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
                    <Button variant="ghost" size="icon" onClick={() => handleViewSubmission(submission)}>
                      <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FontAwesomeIcon icon="comment" className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Submission Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedSubmission.title}</DialogTitle>
                  <Badge variant={getStatusVariant(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Badge>
                </div>
                <DialogDescription>
                  Redline Submission ID: {selectedSubmission.id}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Department</h4>
                    <p className="text-sm">{selectedSubmission.department}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Priority</h4>
                    <Badge variant={getPriorityVariant(selectedSubmission.priority)}>
                      {selectedSubmission.priority}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Submitted By</h4>
                  <p className="text-sm">{selectedSubmission.submittedBy} on {selectedSubmission.submittedDate}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Assigned To</h4>
                  <p className="text-sm">{selectedSubmission.assignedTo}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm">
                    This is a placeholder for the full description of the redline submission.
                    In a real application, this would show the full details provided by the submitter.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Attachments</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <FontAwesomeIcon icon="file-pdf" className="h-4 w-4" />
                    <span className="text-sm text-blue-600 underline cursor-pointer">
                      Drawing_Rev2_with_redlines.pdf
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedSubmission.status === "Pending" && (
                  <Button>
                    <FontAwesomeIcon icon="check" className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}