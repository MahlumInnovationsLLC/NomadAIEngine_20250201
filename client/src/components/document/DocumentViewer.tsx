import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  documentId: string;
  isEditing: boolean;
}

interface DocumentData {
  content: string;
  revision?: string;
}

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [revision, setRevision] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document, isLoading, error } = useQuery<DocumentData>({
    queryKey: [`/api/documents/${encodeURIComponent(documentId)}/content`],
    enabled: !!documentId,
    onSuccess: (data) => {
      if (data) {
        setEditedContent(data.content);
        setRevision(data.revision || "");
      }
    }
  });

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
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] text-destructive">
        <p>Error loading document content. Please try again.</p>
      </div>
    );
  }

  const handleSave = () => {
    saveMutation.mutate(editedContent);
  };

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
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
      <ScrollArea className="h-[500px] w-full rounded-md border">
        {isEditing ? (
          <RichTextEditor
            content={editedContent}
            onChange={setEditedContent}
          />
        ) : (
          <div 
            className="p-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: document?.content ?? 'No content available' }}
          />
        )}
      </ScrollArea>
    </Card>
  );
}