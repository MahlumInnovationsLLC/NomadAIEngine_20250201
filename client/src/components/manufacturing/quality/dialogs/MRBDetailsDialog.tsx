import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MRB } from "@/types/manufacturing/mrb";
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
import { z } from "zod";

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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<DispositionCommentForm>({
    resolver: zodResolver(dispositionCommentSchema),
    defaultValues: {
      comment: "",
    },
  });

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