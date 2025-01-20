import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";

// Lazy load heavy components
const ScrollArea = lazy(() => import("@/components/ui/scroll-area").then(mod => ({ default: mod.ScrollArea })));
const RichTextEditor = lazy(() => import("./RichTextEditor"));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

interface DocumentViewerProps {
  documentId: string;
  isEditing: boolean;
}

interface DocumentData {
  content: string;
  revision?: string;
}

// Separate viewer component for better code splitting
const DocumentContent = ({ content, isEditing, onChange }: { 
  content: string; 
  isEditing: boolean;
  onChange?: (content: string) => void;
}) => {
  if (isEditing) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <RichTextEditor
          content={content}
          onChange={onChange || (() => {})}
        />
      </Suspense>
    );
  }

  return (
    <div 
      className="p-4 prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: content ?? 'No content available' }}
    />
  );
};

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [revision, setRevision] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document, isLoading, error } = useQuery<DocumentData>({
    queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`],
    enabled: !!documentId,
  });

  useEffect(() => {
    if (document) {
      setEditedContent(document.content);
      setRevision(document.revision || "");
    }
  }, [document, documentId]);

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, revision }),
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] text-destructive">
        <p>Error loading document content. Please try again.</p>
      </div>
    );
  }

  return (
    <Card className="relative">
      {isEditing && (
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="revision">Revision</Label>
              <Input
                id="revision"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="Enter revision number or letter (e.g., 1.0, A)"
                className="max-w-[200px]"
              />
            </div>
            <Button 
              onClick={() => saveMutation.mutate(editedContent)}
              disabled={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
      <Suspense fallback={<LoadingSpinner />}>
        <ScrollArea className="h-[500px] w-full rounded-md border">
          <DocumentContent 
            content={editedContent} 
            isEditing={isEditing}
            onChange={setEditedContent}
          />
        </ScrollArea>
      </Suspense>
    </Card>
  );
}