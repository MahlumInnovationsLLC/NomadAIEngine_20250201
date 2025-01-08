import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, Send } from "lucide-react";

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
}

interface DocumentConfigProps {
  documentId: number;
}

export function DocumentConfig({ documentId }: DocumentConfigProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery<DocumentVersion[]>({
    queryKey: [`/api/documents/${documentId}/versions`],
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Document Configuration & Approval
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {versions.map((version) => (
            <div key={version.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Version {version.version}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created by {version.createdBy} on{' '}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(version.status)}
              </div>

              {version.changelog && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Changelog</h4>
                  <p className="text-sm text-muted-foreground">{version.changelog}</p>
                </div>
              )}

              {version.status === 'pending' && (
                <div className="space-y-4">
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
                <div>
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
            </div>
          ))}

          {versions.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No versions available for this document.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
