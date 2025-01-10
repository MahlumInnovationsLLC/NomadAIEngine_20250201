import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface DocumentViewerProps {
  documentId: number;
  isEditing: boolean;
}

interface DocumentData {
  content: string;
}

export function DocumentViewer({ documentId, isEditing }: DocumentViewerProps) {
  const { data: document, isLoading } = useQuery<DocumentData>({
    queryKey: [`/api/documents/${documentId}/content`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Card className="relative">
      <ScrollArea className="h-[500px] w-full rounded-md border">
        {isEditing ? (
          <Textarea
            className="min-h-[500px] resize-none p-4 focus-visible:ring-0"
            defaultValue={document?.content ?? ''}
            placeholder="Document content..."
          />
        ) : (
          <div className="p-4 whitespace-pre-wrap font-mono text-sm">
            {document?.content ?? 'No content available'}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}