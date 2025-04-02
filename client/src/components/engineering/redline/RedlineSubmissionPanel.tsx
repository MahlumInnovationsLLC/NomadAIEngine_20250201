import { useState, useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

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

// Mock data for redline submissions (would be replaced with actual API data)
const mockRedlineSubmissions = [
  {
    id: "RED-001",
    title: "Update PCB Layout for Control Board",
    projectNumber: "PRJ-2025-001",
    requestor: "John Smith",
    department: "Electrical",
    submittedBy: "John Smith",
    submittedDate: "2025-03-15",
    status: "Pending",
    priority: "High",
    assignedTo: "Elizabeth Parker",
    description: "The current PCB layout needs modification to accommodate the new sensor array and improve signal integrity. Additional ground planes are required around the sensitive analog components.",
    attachments: [
      {
        fileName: "Drawing_Rev2_with_redlines.pdf",
        fileType: "application/pdf",
        fileSize: "2.4 MB",
        filePath: "/path/to/Drawing_Rev2_with_redlines.pdf" // This would be a server path in production
      }
    ]
  },
  {
    id: "RED-002",
    title: "Adjust Clearance in Mounting Bracket",
    projectNumber: "PRJ-2025-002",
    requestor: "Sarah Johnson",
    department: "Mechanical",
    submittedBy: "Sarah Johnson",
    submittedDate: "2025-03-18",
    status: "In Review",
    priority: "Medium",
    assignedTo: "Robert Chen",
    description: "The current mounting bracket has insufficient clearance for the new cooler assembly. Need to adjust dimensions according to the marked drawings.",
    attachments: [
      {
        fileName: "Bracket_Design_Rev3.pdf",
        fileType: "application/pdf",
        fileSize: "1.8 MB",
        filePath: "/path/to/Bracket_Design_Rev3.pdf"
      }
    ]
  },
  {
    id: "RED-003",
    title: "Update Network Topology Diagram",
    projectNumber: "PRJ-2025-003",
    requestor: "Michael Brown",
    department: "IT",
    submittedBy: "Michael Brown",
    submittedDate: "2025-03-20",
    status: "Approved",
    priority: "Low",
    assignedTo: "David Garcia",
    description: "Network topology diagram needs to be updated to reflect the new redundant switches and security zones implementation.",
    attachments: [
      {
        fileName: "Network_Topology_Rev2.pdf",
        fileType: "application/pdf",
        fileSize: "1.2 MB",
        filePath: "/path/to/Network_Topology_Rev2.pdf"
      }
    ]
  },
  {
    id: "RED-004",
    title: "Modify API Interface Documentation",
    projectNumber: "PRJ-2025-004",
    requestor: "Jessica Lee",
    department: "NTC",
    submittedBy: "Jessica Lee",
    submittedDate: "2025-03-22",
    status: "Pending",
    priority: "High",
    assignedTo: "Alex Chen",
    description: "The API interface documentation needs to be updated to include the new endpoints and authentication requirements.",
    attachments: [
      {
        fileName: "API_Interface_Spec_Rev5.pdf",
        fileType: "application/pdf",
        fileSize: "3.1 MB",
        filePath: "/path/to/API_Interface_Spec_Rev5.pdf"
      }
    ]
  },
];

export default function RedlineSubmissionPanel() {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<number>(0);
  const [commentText, setCommentText] = useState("");

  // Setup form with validation
  const form = useForm<z.infer<typeof redlineFormSchema>>({
    resolver: zodResolver(redlineFormSchema),
    defaultValues: {
      title: "",
      projectNumber: "",
      requestor: "",
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
  
  // Handle PDF download
  const handleDownloadPdf = (attachment: any) => {
    // In a real app, this would fetch the PDF from the server
    // For demo purposes, we'll simulate a download with a timeout
    toast({
      title: "Downloading file...",
      description: `${attachment.fileName} (${attachment.fileSize})`,
    });
    
    // In production, you would use something like:
    // window.open(attachment.downloadUrl, '_blank');
    // or fetch the file and use the Blob API to download it
  };
  
  // Handle opening comment dialog
  const handleOpenCommentDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setCommentText("");
    setIsCommentDialogOpen(true);
  };
  
  // Handle edit submission
  const handleEditSubmission = (submission: any) => {
    // In a real app, you would load the form with the submission data
    setSelectedSubmission(submission);
    // Pre-fill the form with existing data
    form.reset({
      title: submission.title,
      projectNumber: submission.projectNumber,
      requestor: submission.requestor,
      department: submission.department,
      description: submission.description,
      priority: submission.priority,
      attachmentName: submission.attachments[0]?.fileName || "",
    });
    setIsSubmitDialogOpen(true);
    
    toast({
      title: "Editing submission",
      description: `Now editing ${submission.id}: ${submission.title}`,
    });
  };
  
  // Handle delete submission
  const handleDeleteSubmission = (submission: any) => {
    // In a real app, this would call an API to delete the submission
    toast({
      title: "Submission deleted",
      description: `${submission.id}: ${submission.title} has been deleted.`,
    });
    
    // For demo purposes, we're not actually removing from the array
    // In a real app, you would remove the item from the state or refetch the data
  };
  
  // Handle submitting a comment
  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      toast({
        title: "Cannot submit empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send the comment to the API
    toast({
      title: "Comment submitted",
      description: `Your comment on ${selectedSubmission.id} has been saved.`,
    });
    
    setIsCommentDialogOpen(false);
    setCommentText("");
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
                                <SelectItem value="PRJ-2025-001">PRJ-2025-001: Production Line</SelectItem>
                                <SelectItem value="PRJ-2025-002">PRJ-2025-002: Control System</SelectItem>
                                <SelectItem value="PRJ-2025-003">PRJ-2025-003: Sensor Network</SelectItem>
                                <SelectItem value="PRJ-2025-004">PRJ-2025-004: Safety System</SelectItem>
                                <SelectItem value="PRJ-2025-005">PRJ-2025-005: Maintenance</SelectItem>
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
                    </div>

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
                <TableHead>Project</TableHead>
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
                  <TableCell>{submission.projectNumber}</TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewSubmission(submission)}>
                          <FontAwesomeIcon icon="eye" className="h-4 w-4 mr-2" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSubmission(submission)}>
                          <FontAwesomeIcon icon="edit" className="h-4 w-4 mr-2" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenCommentDialog(submission)}>
                          <FontAwesomeIcon icon="comment" className="h-4 w-4 mr-2" />
                          <span>Comment</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteSubmission(submission)} className="text-red-600">
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
                    <h4 className="text-sm font-medium">Project Number</h4>
                    <p className="text-sm">{selectedSubmission.projectNumber || 'PRJ-2025-001'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Priority</h4>
                    <Badge variant={getPriorityVariant(selectedSubmission.priority)}>
                      {selectedSubmission.priority}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Department</h4>
                    <p className="text-sm">{selectedSubmission.department}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Requestor</h4>
                    <p className="text-sm">{selectedSubmission.requestor || selectedSubmission.submittedBy}</p>
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
                    {selectedSubmission.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Attachments</h4>
                  <Tabs defaultValue="preview" className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="files">Files</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted p-2 flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {selectedSubmission.attachments[0]?.fileName || "No preview available"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDownloadPdf(selectedSubmission.attachments[0])}
                          >
                            <FontAwesomeIcon icon="download" className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="p-4 bg-white h-[400px] flex flex-col items-center justify-center">
                          {/* PDF Preview container */}
                          <div className="border border-gray-200 shadow-sm w-full h-full overflow-hidden bg-gray-50 flex items-center justify-center">
                            {/* For demo, we'll use a placeholder. In production, you'd use react-pdf or similar */}
                            <div className="relative w-full h-full">
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                <FontAwesomeIcon icon="file-pdf" className="h-16 w-16 text-red-500 mb-4" />
                                <h3 className="text-lg font-medium mb-2">{selectedSubmission.attachments[0]?.fileName}</h3>
                                <p className="text-sm text-gray-500 text-center mb-4">
                                  {selectedSubmission.attachments[0]?.fileSize} • PDF Document
                                </p>
                                <Button onClick={() => handleDownloadPdf(selectedSubmission.attachments[0])}>
                                  <FontAwesomeIcon icon="download" className="h-4 w-4 mr-2" />
                                  Download PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="files" className="mt-4">
                      <div className="space-y-2">
                        {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 ? (
                          selectedSubmission.attachments.map((attachment: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center gap-3">
                                <FontAwesomeIcon icon="file-pdf" className="h-8 w-8 text-red-500" />
                                <div>
                                  <p className="font-medium">{attachment.fileName}</p>
                                  <p className="text-sm text-gray-500">{attachment.fileSize}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(attachment)}>
                                <FontAwesomeIcon icon="download" className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No attachments found</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
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
      
      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>Add Comment</DialogTitle>
                <DialogDescription>
                  Add a comment to redline submission #{selectedSubmission.id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Your Comment</h4>
                  <Textarea 
                    id="comment" 
                    placeholder="Enter your comment here..." 
                    className="min-h-[120px]" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitComment}>
                  <FontAwesomeIcon icon="paper-plane" className="mr-2 h-4 w-4" />
                  Submit Comment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}