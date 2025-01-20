import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Edit, Download, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

interface DocManageProps {
  documentId: number | null;
}

interface Document {
  id: number;
  title: string;
  content: string;
  lastModified: string;
  status: 'draft' | 'in_review' | 'approved';
}

export function DocManage({ documentId }: DocManageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ['/api/documents/get', documentId],
    enabled: !!documentId,
  });

  const handleSave = async () => {
    try {
      // Save document changes
      toast({
        title: "Changes saved",
        description: "Document has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimateTransition variant="fade">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{document?.title || "Document Viewer"}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={!documentId}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              {isEditing && (
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
              <Button variant="outline" size="sm" disabled={!documentId}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {documentId && document ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {isEditing ? (
                  <textarea
                    className="w-full h-[500px] p-4 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue={document.content}
                  />
                ) : (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Last modified: {new Date(document.lastModified).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{document.content}</div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Select a document from DocExplorer to view or edit.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </AnimateTransition>
  );
}

export default DocManage;