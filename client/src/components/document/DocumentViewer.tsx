import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichTextEditor } from "./RichTextEditor";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface DocumentViewerProps {
  documentId: string;
  isEditing: boolean;
}

interface DocumentData {
  content: string;
  version: string;
  status: 'draft' | 'in_review' | 'approved' | 'released';
  lastModified: string;
  approvers?: string[];
}

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [version, setVersion] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document, isLoading } = useQuery<DocumentData>({
    queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`],
    enabled: !!documentId,
  });

  useEffect(() => {
    if (document) {
      setEditedContent(document.content);
      setVersion(document.version);
    }
  }, [document]);

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, version }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to save document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`] });
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save document changes",
        variant: "destructive",
      });
    }
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to submit for review');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submitted for review",
        description: "Document has been submitted for review. Approvers will be notified.",
      });
      setIsSubmittingForReview(false);
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit document for review",
        variant: "destructive",
      });
      setIsSubmittingForReview(false);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="relative">
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isEditing && (
              <>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 1.0.0"
                    className="max-w-[150px]"
                  />
                </div>
                <Button 
                  onClick={() => saveMutation.mutate(editedContent)}
                  disabled={saveMutation.isPending}
                >
                  <FontAwesomeIcon icon="save" className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </>
            )}
          </div>
          {document?.status === 'draft' && !isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsSubmittingForReview(true)}
              disabled={submitForReviewMutation.isPending}
            >
              <FontAwesomeIcon icon="paper-plane" className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
          )}
        </div>
        {document && (
          <div className="mt-2 text-sm text-muted-foreground">
            Status: {document.status} | Last modified: {new Date(document.lastModified).toLocaleString()}
          </div>
        )}
      </div>
      <ScrollArea className="h-[500px] w-full rounded-md border">
        {isEditing ? (
          <RichTextEditor
            content={editedContent}
            onChange={setEditedContent}
          />
        ) : (
          <div 
            className="p-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: editedContent }}
          />
        )}
      </ScrollArea>
    </Card>
  );
}

export default DocumentViewer;