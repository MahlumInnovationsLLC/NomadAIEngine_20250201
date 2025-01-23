import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Save, AlertCircle, Loader2, UserCheck } from "lucide-react";

interface DocumentViewerProps {
  documentId: string;
  isEditing: boolean;
}

interface DocumentData {
  content: string;
  version: string;
  status: 'draft' | 'in_review' | 'approved' | 'released';
  lastModified: string;
  assignedReviewer?: {
    id: string;
    name: string;
  };
  reviewComment?: string;
}

const statusColors = {
  draft: "bg-gray-500",
  in_review: "bg-blue-500",
  approved: "bg-green-500",
  released: "bg-purple-500",
};

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const [version, setVersion] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

  useEffect(() => {
    if (document) {
      console.log("Setting document content:", document.content);
      setEditedContent(document.content);
      setVersion(document.version);
    }
  }, [document]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log("Saving document:", documentId);
      const response = await fetch(`/api/documents/${documentId}/content`, {
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
      <Card className="flex items-center justify-center p-4 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center justify-center p-4 h-full text-destructive">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mb-2 mx-auto" />
          <p>Failed to load document: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className="flex items-center justify-center p-4 h-full text-muted-foreground">
        <p>No document content available</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge className={statusColors[document.status]}>
              {document.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {document.assignedReviewer && (
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  Reviewer: {document.assignedReviewer.name}
                </span>
              </div>
            )}
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
          Version: {document.version} | Last modified: {new Date(document.lastModified).toLocaleString()}
        </div>
        {document.reviewComment && (
          <div className="mt-2 p-2 bg-muted rounded-md">
            <p className="text-sm font-medium">Review Comment:</p>
            <p className="text-sm text-muted-foreground">{document.reviewComment}</p>
          </div>
        )}
      </div>
      <ScrollArea className="flex-grow p-4">
        {isEditing ? (
          <textarea
            className="w-full h-full min-h-[400px] p-4 border rounded resize-none focus:outline-none"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {document.content}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

export default DocumentViewer;