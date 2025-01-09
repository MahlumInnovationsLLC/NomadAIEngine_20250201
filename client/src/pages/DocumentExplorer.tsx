import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/document/FileUpload";
import { FileExplorer } from "@/components/document/FileExplorer";
import { useState } from "react";

export default function DocumentExplorer() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  return (
    <div>
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Explorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
            <FileExplorer />
            {showUploadDialog && (
              <FileUpload
                onUpload={async () => {
                  // Handle upload
                  setShowUploadDialog(false);
                }}
                onClose={() => setShowUploadDialog(false)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}