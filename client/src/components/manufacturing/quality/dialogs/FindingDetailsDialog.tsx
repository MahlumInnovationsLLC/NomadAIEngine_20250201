import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faFileSignature,
  faHistory,
  faUserGroup,
  faExclamationTriangle,
  faCheckCircle,
  faFile,
  faImage,
  faFilePdf,
  faDownload,
  faTrash,
  faFileUpload,
} from "@fortawesome/pro-light-svg-icons";
import type { Finding } from "@/types/manufacturing";

interface FindingDetailsDialogProps {
  finding: Finding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FindingDetailsDialog({
  finding,
  open,
  onOpenChange,
}: FindingDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [response, setResponse] = useState("");
  const [justification, setJustification] = useState("");
  const [reviewCycle, setReviewCycle] = useState<'quarterly' | 'semi-annual' | 'annual'>('quarterly');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Convert FileList to array and append to existing files
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return faFilePdf;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return faImage;
      default:
        return faFile;
    }
  };

  const handleSubmitResponse = async () => {
    try {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('findingId', finding.id);
      formData.append('content', response);
      formData.append('respondedBy', "Current User"); // Replace with actual user
      formData.append('responseDate', new Date().toISOString());
      formData.append('status', 'submitted');

      // Append each file to formData
      uploadedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const res = await fetch(`/api/manufacturing/quality/audits/findings/${finding.id}/responses`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to submit response');

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/audits/findings'] });
      setResponse("");
      setUploadedFiles([]);
      toast({
        title: "Success",
        description: "Response submitted successfully",
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit response",
      });
    }
  };

  const handleAcceptRisk = async () => {
    try {
      const acceptanceData = {
        findingId: finding.id,
        justification,
        reviewCycle,
        acceptedBy: "Current User", // Replace with actual user
        acceptanceDate: new Date().toISOString(),
        digitalSignature: {
          signedBy: "Current User", // Replace with actual user
          signatureDate: new Date().toISOString(),
          ipAddress: window.location.hostname,
          userAgent: navigator.userAgent
        }
      };

      const res = await fetch(`/api/manufacturing/quality/audits/findings/${finding.id}/risk-acceptance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acceptanceData),
      });

      if (!res.ok) throw new Error('Failed to submit risk acceptance');

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/audits/findings'] });
      setJustification("");
      toast({
        title: "Success",
        description: "Risk acceptance submitted successfully",
      });
    } catch (error) {
      console.error('Error submitting risk acceptance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit risk acceptance",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Finding Details
            <span className={`px-2 py-1 rounded-full text-xs ${
              finding.type === 'major' ? 'bg-red-100 text-red-800' :
              finding.type === 'minor' ? 'bg-yellow-100 text-yellow-800' :
              finding.type === 'observation' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {finding.type}
            </span>
          </DialogTitle>
          <DialogDescription>
            View and manage finding details, responses, and risk acceptance
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-12rem)] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <p className="text-sm text-muted-foreground">{finding.department}</p>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <p className="text-sm text-muted-foreground">{finding.priority}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Dates & Assignment</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Due Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {finding.dueDate ? format(new Date(finding.dueDate), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label>Response Due Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {finding.responseDueDate ? format(new Date(finding.responseDueDate), 'MMM d, yyyy') : 'Not required'}
                      </p>
                    </div>
                    <div>
                      <Label>Assigned To</Label>
                      <p className="text-sm text-muted-foreground">{finding.assignedTo || 'Unassigned'}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Impact & Root Cause Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Impact</Label>
                    <p className="text-sm text-muted-foreground">{finding.impact || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Root Cause</Label>
                    <p className="text-sm text-muted-foreground">{finding.rootCause || 'Not identified'}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Response History</h3>
                <div className="space-y-4">
                  {finding.responses?.map((response) => (
                    <div key={response.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{response.respondedBy}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(response.responseDate), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          response.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          response.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {response.status}
                        </span>
                      </div>
                      <p className="text-sm">{response.content}</p>
                      {response.attachments && response.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm font-medium">Attachments:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {response.attachments.map((attachment, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-2 p-2 rounded-md bg-muted"
                              >
                                <FontAwesomeIcon 
                                  icon={getFileIcon(attachment.name)} 
                                  className="h-4 w-4" 
                                />
                                <span className="text-sm truncate flex-1">
                                  {attachment.name}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                >
                                  <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {response.reviewComments && (
                        <div className="bg-muted p-2 rounded-md mt-2">
                          <p className="text-sm font-medium">Review Comments:</p>
                          <p className="text-sm">{response.reviewComments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Submit Response</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Your Response</Label>
                    <Textarea
                      placeholder="Enter your response..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Attachments</Label>
                    <div className="mt-2 space-y-4">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="w-full"
                        >
                          <FontAwesomeIcon icon={faFileUpload} className="mr-2 h-4 w-4" />
                          Upload Files
                        </Button>
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 rounded-md bg-muted"
                            >
                              <FontAwesomeIcon
                                icon={getFileIcon(file.name)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm truncate flex-1">
                                {file.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmitResponse} 
                    disabled={!response.trim() || uploadProgress > 0}
                  >
                    {uploadProgress > 0 ? "Uploading..." : "Submit Response"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              {finding.riskAcceptance ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Current Risk Acceptance</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Accepted By</Label>
                      <p className="text-sm text-muted-foreground">{finding.riskAcceptance.acceptedBy}</p>
                    </div>
                    <div>
                      <Label>Acceptance Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(finding.riskAcceptance.acceptanceDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <Label>Justification</Label>
                      <p className="text-sm text-muted-foreground">{finding.riskAcceptance.justification}</p>
                    </div>
                    <div>
                      <Label>Review Cycle</Label>
                      <p className="text-sm text-muted-foreground">{finding.riskAcceptance.reviewCycle}</p>
                    </div>
                    <div>
                      <Label>Digital Signature</Label>
                      <div className="bg-muted p-2 rounded-md">
                        <p className="text-sm">Signed by: {finding.riskAcceptance.digitalSignature.signedBy}</p>
                        <p className="text-sm">Date: {format(new Date(finding.riskAcceptance.digitalSignature.signatureDate), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Accept Risk</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Justification</Label>
                      <Textarea
                        placeholder="Explain why this risk is acceptable..."
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Review Cycle</Label>
                      <Select value={reviewCycle} onValueChange={(value: any) => setReviewCycle(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select review cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleAcceptRisk} 
                      disabled={!justification.trim()}
                      className="bg-yellow-500 hover:bg-yellow-600"
                    >
                      Accept Risk & Sign
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  {finding.timeline?.map((event) => (
                    <div key={event.id} className="flex gap-4 items-start">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.event}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')} by {event.performedBy}
                        </p>
                        {event.details && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}: </span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}