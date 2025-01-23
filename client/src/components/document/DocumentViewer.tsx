import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface DocumentViewerProps {
  documentId: string;
  isEditing: boolean;
}

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/documents/content', documentId],
    enabled: Boolean(documentId),
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No document selected
  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a document to view its contents</p>
      </div>
    );
  }

  // Document loaded - display content
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {data?.content || 'No content available'}
        </pre>
      </div>
    </ScrollArea>
  );
}

export default DocumentViewer;