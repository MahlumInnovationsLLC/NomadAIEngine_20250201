import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MRB, MRBTask, MRBNote, MRBAttachment } from "@/types/manufacturing/mrb"; // Updated import
import { MRBDialog } from "./MRBDialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faEye,
  faSpinner,
  faUserCheck,
  faHistory,
  faFile,
  faFileUpload,
  faTrash,
  faPlus,
  faCheck,
  faBan,
  faPlay,
  faPause,
} from '@fortawesome/pro-light-svg-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { generateUUID } from "@/lib/utils";

interface TaskCommentFormData {
  text: string;
}

const taskCommentSchema = z.object({
  text: z.string().min(1, "Comment is required"),
});

interface MRBDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mrb: MRB;
  onSuccess?: () => void;
}

const dispositionCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
});

type DispositionCommentForm = z.infer<typeof dispositionCommentSchema>;

export function MRBDetailsDialog({ open, onOpenChange, mrb, onSuccess }: MRBDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<DispositionCommentForm>({
    resolver: zodResolver(dispositionCommentSchema),
    defaultValues: {
      comment: "",
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/manufacturing/quality/mrb/${mrb.id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload attachment');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
      toast({
        title: "Success",
        description: "Attachment uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload attachment",
        variant: "destructive",
      });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/manufacturing/quality/mrb/${mrb.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete attachment",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async (task: Partial<MRBTask>) => {
    try {
      const newTask = {
        ...task,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "pending",
      };

      const response = await fetch(`/api/manufacturing/quality/mrb/${mrb.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleAddTaskComment = async (taskId: string, comment: TaskCommentFormData) => {
    try {
      const response = await fetch(`/api/manufacturing/quality/mrb/${mrb.id}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...comment,
          id: generateUUID(),
          author: "current-user", // Replace with actual user info when available
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string, blockedReason?: string) => {
    try {
      const response = await fetch(`/api/manufacturing/quality/mrb/${mrb.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          blockedReason,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'major':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDispositionDecision = (decision: string | undefined) => {
    if (!decision) return 'Pending';
    return decision.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
    setShowEditDialog(false);
    if (onSuccess) onSuccess();
  };

  const handleApproveDisposition = async (comment: string) => {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/manufacturing/quality/mrb/${mrb.id}/disposition/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment,
          approvedBy: "Current User", // Replace with actual user info when available
          approvedAt: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve disposition');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });

      toast({
        title: "Success",
        description: "Disposition approved successfully",
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving disposition:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve disposition",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitComment = (data: DispositionCommentForm) => {
    handleApproveDisposition(data.comment);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold">{mrb.title || `MRB #${mrb.number}`}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>MRB #{mrb.number}</span>
                  <span>•</span>
                  <span>Created: {formatDate(mrb.createdAt)}</span>
                  <span>•</span>
                  <Badge variant={getSeverityColor(mrb.severity)}>{mrb.severity}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                  Edit MRB
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <Tabs defaultValue="details" className="h-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="disposition">Disposition</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="cost-impact">Cost Impact</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Source Type</h4>
                        <Badge>{mrb.sourceType || 'Direct'}</Badge>
                      </div>
                      {mrb.sourceType === 'NCR' && (
                        <div>
                          <h4 className="font-medium mb-1">NCR Number</h4>
                          <p className="text-muted-foreground">{mrb.ncrNumber}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium mb-1">Part Number</h4>
                        <p className="text-muted-foreground">{mrb.partNumber}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Lot Number</h4>
                        <p className="text-muted-foreground">{mrb.lotNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Quantity</h4>
                        <p className="text-muted-foreground">{mrb.quantity} {mrb.unit || 'pcs'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Location</h4>
                        <p className="text-muted-foreground">{mrb.location || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {mrb.nonconformance && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Nonconformance Details</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Description</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {mrb.nonconformance.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-1">Detected By</h4>
                              <p className="text-muted-foreground">
                                {mrb.nonconformance.detectedBy}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Detected Date</h4>
                              <p className="text-muted-foreground">
                                {formatDate(mrb.nonconformance.detectedDate)}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Defect Type</h4>
                              <p className="text-muted-foreground capitalize">
                                {mrb.nonconformance.defectType?.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="disposition" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Disposition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Decision</h4>
                      <Badge variant="outline" className="capitalize">
                        {formatDispositionDecision(mrb.disposition?.decision)}
                      </Badge>
                    </div>

                    {mrb.disposition?.justification && (
                      <div>
                        <h4 className="font-medium mb-2">Justification</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {mrb.disposition.justification}
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Disposition Approval</h4>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitComment)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Comment</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter your disposition approval comments..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Provide any additional comments or concerns regarding this disposition.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={submitting}>
                            {submitting ? (
                              <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <FontAwesomeIcon icon={faUserCheck} className="mr-2 h-4 w-4" />
                            )}
                            Approve Disposition
                          </Button>
                        </form>
                      </Form>
                    </div>

                    {mrb.disposition.approvedBy?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Approvals</h4>
                        <div className="space-y-2">
                          {mrb.disposition.approvedBy.map((approval, index) => (
                            <Card key={index}>
                              <CardContent className="py-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{approval.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(approval.date)}
                                    </p>
                                  </div>
                                  <Badge variant="outline">Approved</Badge>
                                </div>
                                {approval.comment && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {approval.comment}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tasks</CardTitle>
                    <Button onClick={() => handleAddTask({
                      title: "New Task",
                      description: "",
                      assignedTo: "",
                      dueDate: new Date().toISOString(),
                      priority: "medium",
                    })}>
                      <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mrb.tasks?.map((task, index) => (
                        <Card key={task.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{task.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">{task.status}</Badge>
                                  <Badge variant="outline">{task.priority}</Badge>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Assigned to: {task.assignedTo}</p>
                                <p>Due: {formatDate(task.dueDate)}</p>
                              </div>
                            </div>
                            {task.status === "blocked" && task.blockedReason && (
                              <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                                <p className="text-sm text-destructive">Blocked: {task.blockedReason}</p>
                              </div>
                            )}
                            {task.comments && task.comments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <h5 className="text-sm font-medium">Comments</h5>
                                {task.comments.map((comment) => (
                                  <div key={comment.id} className="text-sm bg-muted p-2 rounded-md">
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium">{comment.author}</span>
                                      <span className="text-muted-foreground">{formatDate(comment.timestamp)}</span>
                                    </div>
                                    <p className="mt-1">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-4 space-y-4">
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const commentText = form.getValues(`comment-${task.id}`);
                                if (commentText) {
                                  handleAddTaskComment(task.id, { text: commentText });
                                  form.setValue(`comment-${task.id}`, '');
                                }
                              }}>
                                <FormField
                                  control={form.control}
                                  name={`comment-${task.id}`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <div className="flex gap-2">
                                          <Textarea
                                            placeholder="Add a comment..."
                                            className="h-20"
                                            {...field}
                                          />
                                          <Button type="submit" size="sm" className="mt-auto">
                                            Add Comment
                                          </Button>
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </form>
                              <div className="flex gap-2 mt-4">
                                {task.status !== "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                                    Complete
                                  </Button>
                                )}
                                {task.status !== "blocked" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const reason = window.prompt("Please enter the reason for blocking this task:");
                                      if (reason) {
                                        await handleUpdateTaskStatus(task.id, "blocked", reason);
                                      }
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faBan} className="mr-2 h-4 w-4" />
                                    Block
                                  </Button>
                                )}
                                {task.status !== "in_progress" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                                  >
                                    <FontAwesomeIcon icon={faPlay} className="mr-2 h-4 w-4" />
                                    Start
                                  </Button>
                                )}
                                {task.status !== "on_hold" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateTaskStatus(task.id, "on_hold")}
                                  >
                                    <FontAwesomeIcon icon={faPause} className="mr-2 h-4 w-4" />
                                    Hold
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Attachments</CardTitle>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button asChild>
                          <span>
                            <FontAwesomeIcon icon={faFileUpload} className="mr-2 h-4 w-4" />
                            Upload File
                          </span>
                        </Button>
                      </label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mrb.attachments?.map((attachment) => (
                        <Card key={attachment.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faFile} className="h-4 w-4" />
                                <div>
                                  <p className="font-medium">{attachment.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Uploaded by {attachment.uploadedBy} on {formatDate(attachment.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {attachment.version && (
                                  <Badge variant="outline" className="ml-2">v{attachment.version}</Badge>
                                )}
                                {attachment.status && (
                                  <Badge variant="outline" className="ml-2">{attachment.status}</Badge>
                                )}
                                {attachment.tags && attachment.tags.length > 0 && (
                                  <div className="mt-2 flex gap-1">
                                    {attachment.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="secondary">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(attachment.url, '_blank', 'noopener,noreferrer')}
                                >
                                  <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAttachment(attachment.id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cost-impact" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Cost Impact Analysis</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                      Edit Cost Impact
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Material Cost</h4>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(mrb.costImpact?.materialCost, mrb.costImpact?.currency)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Labor Cost</h4>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(mrb.costImpact?.laborCost, mrb.costImpact?.currency)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Rework Cost</h4>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(mrb.costImpact?.reworkCost, mrb.costImpact?.currency)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Total Impact</h4>
                        <p className="text-2xl font-semibold text-destructive">
                          {formatCurrency(mrb.costImpact?.totalCost, mrb.costImpact?.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {mrb.history && mrb.history.length > 0 ? (
                  <div className="space-y-4">
                    {mrb.history.map((event, index) => (
                      <Card key={index}>
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <p className="font-medium">{event.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <span>{event.user}</span>
                                <span>•</span>
                                <span>{formatDate(event.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FontAwesomeIcon icon={faHistory} className="h-8 w-8 mb-4" />
                    <p>No history events recorded yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-6 border-t mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <MRBDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          initialData={mrb}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}