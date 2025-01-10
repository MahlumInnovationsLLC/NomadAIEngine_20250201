import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocumentConfig } from "@/components/document/DocumentConfig";

export function DocManage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  return (
    <div className="container mx-auto">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-2">
          <h1 className="text-2xl font-bold">Document Training & Control</h1>
          <p className="text-muted-foreground">
            Browse and manage documents with advanced training and workflow control.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[300px,1fr] gap-6">
        <Card className="h-[calc(100vh-12rem)] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Document Explorer
            </CardTitle>
          </CardHeader>
          <CardContent className="-mx-2">
            <FileExplorer onSelectDocument={(id) => setSelectedDocumentId(id)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedDocumentId ? (
            <Card>
              <CardContent className="pt-6">
                <DocumentConfig documentId={selectedDocumentId} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Select a document from the explorer to view and manage its details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}