import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { FileExplorer } from "@/components/document/FileExplorer";
import { DocManage } from "@/components/document/DocManage";
import { AnimateTransition } from "@/components/ui/AnimateTransition";

export default function DocumentManagement() {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);

  return (
    <AnimateTransition variant="fade">
      <div className="container mx-auto">
        <div className="py-6 border-b">
          <div className="container px-4">
            <h1 className="text-3xl font-bold mb-2">Document Training & Control</h1>
            <p className="text-muted-foreground">
              Manage, review, and approve documents with advanced training and workflow control.
            </p>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="grid grid-cols-[30%_70%] gap-6">
            <Card className="h-[calc(100vh-16rem)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FontAwesomeIcon icon="file-lines" className="mr-2 h-5 w-5" />
                  DocExplorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileExplorer onSelectDocument={(id) => setSelectedDocument(Number(id))} />
              </CardContent>
            </Card>

            <div className="h-[calc(100vh-16rem)]">
              <DocManage documentId={selectedDocument} />
            </div>
          </div>
        </div>
      </div>
    </AnimateTransition>
  );
}