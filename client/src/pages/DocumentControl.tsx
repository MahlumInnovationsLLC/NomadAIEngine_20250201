import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Clock, FileText } from "lucide-react";
import FileUpload from "@/components/document/FileUpload";
import { useToast } from "@/hooks/use-toast";

export default function DocumentControl() {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { toast } = useToast();

  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
  });

  const handleFileUpload = async (files: File[]) => {
    // TODO: Implement file upload with versioning
    setShowFileUpload(false);
    toast({
      title: "Files uploaded",
      description: `Successfully uploaded ${files.length} files`,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Document Training & Control</h1>
        <Button onClick={() => setShowFileUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add document list with versions */}
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add version history list */}
            <p className="text-muted-foreground">No version history available.</p>
          </CardContent>
        </Card>
      </div>

      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
}
