import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocControl } from "@/components/document/DocControl";
import { DocumentConfig } from "@/components/document/DocumentConfig";

export function DocManage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  return (
    <div className="container mx-auto py-6">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6">
        <div className="px-4">
          <h1 className="text-3xl font-bold mb-1">Document Training & Control</h1>
          <p className="text-muted-foreground mb-4">
            Browse and manage documents with advanced training and workflow control.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Document Explorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileExplorer onSelectDocument={(id) => setSelectedDocumentId(id)} />
          </CardContent>
        </Card>

        {selectedDocumentId && (
          <Card>
            <CardContent className="pt-6">
              <DocumentConfig documentId={selectedDocumentId} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}