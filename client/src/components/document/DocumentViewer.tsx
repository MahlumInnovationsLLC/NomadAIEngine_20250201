import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Save, AlertCircle, Loader2 } from "lucide-react";

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

const statusColors = {
  draft: "bg-gray-500",
  in_review: "bg-blue-500",
  approved: "bg-green-500",
  released: "bg-purple-500",
};

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [editedContent, setEditedContent] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document content
  const { data: document, isLoading, error } = useQuery<DocumentData>({
    queryKey: ['/api/documents/content', documentId],
    enabled: !!documentId, // Only fetch when documentId is available
  });

  // Update local state when document changes
  useEffect(() => {
    if (document) {
      setEditedContent(document.content || '');
      setVersion(document.version || '');
    }
  }, [document]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/documents/content/${encodeURIComponent(documentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent,
          version,
          status: document?.status || 'draft'
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to save document');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/content', documentId] });
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save document changes",
        variant: "destructive",
      });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-destructive">
          <AlertCircle className="h-8 w-8 mb-2 mx-auto" />
          <p>Error loading document: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // No document state
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-muted-foreground">
        <p>No document content available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge className={statusColors[document.status]}>
              {document.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          {isEditing && (
            <div className="flex items-center gap-2">
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
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Last modified: {new Date(document.lastModified).toLocaleString()}
        </div>
      </div>
      <ScrollArea className="flex-grow p-4">
        {isEditing ? (
          <textarea
            className="w-full h-full min-h-[400px] p-4 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {editedContent || document.content || 'No content available'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default DocumentViewer;