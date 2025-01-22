import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [version, setVersion] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document content
  const { data: document, isLoading, error } = useQuery<DocumentData>({
    queryKey: [`/api/documents/${documentId}/content`],
    queryFn: async () => {
      console.log("Fetching document content for:", documentId);
      try {
        const response = await fetch(`/api/documents/${documentId}/content`, {
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching document:", errorText);
          throw new Error(errorText || `Failed to fetch document: ${response.status}`);
        }
        const data = await response.json();
        console.log("Received document data:", data);
        return data;
      } catch (error) {
        console.error("Error in document fetch:", error);
        throw error;
      }
    },
    enabled: !!documentId,
    retry: 1,
  });

  // Update local state when document data changes
  useEffect(() => {
    if (document) {
      console.log("Setting document content:", document);
      setEditedContent(document.content || '');
      setVersion(document.version || '1.0');
    }
  }, [document]);

  // Save document changes
  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log("Saving document:", documentId);
      const response = await fetch(`/api/documents/${documentId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent, version }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/content`] });
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
    },
  });

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-4 h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center justify-center p-4 h-[600px] text-destructive">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mb-2 mx-auto" />
          <p>Failed to load document: {error instanceof Error ? error.message : 'Unknown error'}</p>
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
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
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
          <textarea
            className="w-full h-full p-4 focus:outline-none resize-none"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
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