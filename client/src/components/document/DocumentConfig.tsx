import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, Send, History, FileText, AlertCircle, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DocumentVersion {
  id: number;
  version: string;
  blobStorageUrl: string;
  changelog: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  comments?: Array<{
    id: number;
    text: string;
    userId: string;
    createdAt: string;
  }>;
}

interface Document {
  id: number;
  title: string;
  version: string;
}

interface DocumentConfigProps {
  documentId: number;
}

export function DocumentConfig({ documentId }: DocumentConfigProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [newVersion, setNewVersion] = useState<File | null>(null);
  const [changelog, setChangelog] = useState("");
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document, isLoading: isLoadingDocument } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });

  const { data: versions = [], isLoading: isLoadingVersions } = useQuery<DocumentVersion[]>({
    queryKey: [`/api/documents/${documentId}/versions`],
    enabled: !!documentId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ versionId, approved, notes }: { versionId: number; approved: boolean; notes: string }) => {
      const response = await fetch(`/api/documents/versions/${versionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, notes }),
      });
      if (!response.ok) throw new Error('Failed to update version status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/versions`] });
      toast({
        title: "Review submitted",
        description: "Document version has been reviewed successfully",
      });
      setReviewNotes("");
    },
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async () => {
      if (!newVersion) return;
      const formData = new FormData();
      formData.append('file', newVersion);
      formData.append('changelog', changelog);

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload new version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/versions`] });
      toast({
        title: "Version uploaded",
        description: "New version has been uploaded successfully",
      });
      setNewVersion(null);
      setChangelog("");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const response = await fetch(`/api/documents/versions/${versionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/versions`] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
      setComment("");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const response = await fetch(`/api/documents/versions/${version.id}/download`);
      if (!response.ok) throw new Error('Failed to download version');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document?.title || 'document'}_v${version.version}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the document version",
        variant: "destructive",
      });
    }
  };

  if (isLoadingDocument || isLoadingVersions) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading document configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Document Configuration & Approval
          </div>
          {document && (
            <Badge variant="outline" className="text-xs">
              Current Version: v{document.version}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Upload New Version */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Upload New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Version</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  type="file"
                  onChange={(e) => setNewVersion(e.target.files?.[0] || null)}
                />
                <Textarea
                  placeholder="Describe the changes in this version..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                />
                <Button 
                  onClick={() => uploadVersionMutation.mutate()}
                  disabled={!newVersion || !changelog}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Upload Version
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Version History */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Version History</h3>
            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="single" collapsible className="space-y-4">
                {versions.map((version) => (
                  <AccordionItem key={version.id} value={`version-${version.id}`} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <span className="font-medium">Version {version.version}</span>
                          <span className="text-sm text-muted-foreground ml-4">
                            {new Date(version.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {getStatusBadge(version.status)}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Created by {version.createdBy}
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadVersion(version)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(version.blobStorageUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                        </div>

                        {version.changelog && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Changelog</h4>
                            <p className="text-sm text-muted-foreground">{version.changelog}</p>
                          </div>
                        )}

                        {version.status === 'pending' && (
                          <div className="space-y-4">
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                              <div className="flex">
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                                <div className="ml-3">
                                  <p className="text-sm text-yellow-700">
                                    This version is pending review. Add your review notes and approve or reject the changes.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Textarea
                              placeholder="Enter review notes..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => approveMutation.mutate({
                                  versionId: version.id,
                                  approved: true,
                                  notes: reviewNotes
                                })}
                                className="flex-1"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => approveMutation.mutate({
                                  versionId: version.id,
                                  approved: false,
                                  notes: reviewNotes
                                })}
                                className="flex-1"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {version.reviewerNotes && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <h4 className="text-sm font-medium mb-1">Review Notes</h4>
                            <p className="text-sm text-muted-foreground">{version.reviewerNotes}</p>
                            {version.approvedBy && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Reviewed by {version.approvedBy} on{' '}
                                {new Date(version.approvedAt!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Comments Section */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Comments</h4>
                          <div className="space-y-2">
                            {version.comments?.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm">{comment.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  By {comment.userId} on {new Date(comment.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                              />
                              <Button
                                size="sm"
                                onClick={() => addCommentMutation.mutate(version.id)}
                                disabled={!comment.trim()}
                              >
                                Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {versions.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No versions available for this document.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload a new version to start the review process.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}