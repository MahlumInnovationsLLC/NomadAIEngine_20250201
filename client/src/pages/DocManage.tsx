import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocControl } from "@/components/document/DocControl";

export default function DocManage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  return (
    <div className="container mx-auto">
      <div className="p-8 border-b bg-background">
        <h1 className="text-3xl font-bold mb-2">Document Management</h1>
        <p className="text-muted-foreground">
          Browse, manage, and control document versions and permissions
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                DocExplorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileExplorer onSelectDocument={(id) => setSelectedDocumentId(id)} />
            </CardContent>
          </Card>

          <DocControl documentId={selectedDocumentId} />
        </div>
      </div>
    </div>
  );
}
