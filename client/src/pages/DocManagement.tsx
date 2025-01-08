import { DocumentConfig } from "@/components/document/DocumentConfig";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export function DocManagement() {
  // Fetch all documents
  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
  });

  // Use the first document for now
  const documentId = documents?.[0]?.id;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Document Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentId ? (
            <DocumentConfig documentId={documentId} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No documents found. Please upload a document first.</p>
              {/* TODO: Add document upload button here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}