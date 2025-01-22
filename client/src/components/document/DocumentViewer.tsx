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
}

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [version, setVersion] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document content
  const { data: document, isLoading, error } = useQuery<DocumentData>({
    queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`],
    enabled: !!documentId,
    retry: 1,
    onError: (err: any) => {
      console.error("Error fetching document:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load document content",
        variant: "destructive",
      });
    }
  });

  // Update local state when document data changes
  useEffect(() => {
    if (document) {
      console.log("Document data received:", document);
      setEditedContent(document.content || '');
      setVersion(document.version || '1.0');
    }
  }, [document]);

  // Save document changes
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log("Saving document:", documentId);
      const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, version }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`] });
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully",
      });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save document changes",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-4 h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center justify-center p-4 h-[600px] text-destructive">
        <div className="text-center">
          <FontAwesomeIcon icon="exclamation-circle" className="h-8 w-8 mb-2" />
          <p>Failed to load document: {(error as Error).message || 'Unknown error'}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative h-[600px]">
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
        </div>
        {document && (
          <div className="mt-2 text-sm text-muted-foreground">
            Version: {document.version} | Status: {document.status} | Last modified: {new Date(document.lastModified).toLocaleString()}
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
            dangerouslySetInnerHTML={{ __html: document?.content || '' }}
          />
        )}
      </ScrollArea>
    </Card>
  );
}

export default DocumentViewer;