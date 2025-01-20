import { DocumentConfig } from "@/components/document/DocumentConfig";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";

export function DocManagement() {
  const [, setLocation] = useLocation();

  // Fetch all documents
  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
  });

  // Use the first document for now
  const documentId = documents?.[0]?.id;

  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
        <p className="text-muted-foreground mb-4">
          Manage your documents, configure training modules, and control document workflows.
        </p>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setLocation("/docmanage/docmanagement")}
              className="px-6 py-2 text-sm font-medium border bg-primary text-primary-foreground border-primary rounded-l-lg focus:z-10 focus:outline-none"
            >
              DocManagement
            </button>
            <button
              onClick={() => setLocation("/docmanage/training")}
              className="px-6 py-2 text-sm font-medium border-t border-b border-r bg-background hover:bg-secondary rounded-r-lg focus:z-10 focus:outline-none"
            >
              Training Module
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}