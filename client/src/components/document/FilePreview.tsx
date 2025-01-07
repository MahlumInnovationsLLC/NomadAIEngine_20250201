import { FileIcon, ImageIcon, FileTextIcon, FileArchiveIcon, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface FilePreviewProps {
  file: {
    filename: string;
    mimeType: string;
    size: string;
    path: string;
  };
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  const getFileIcon = () => {
    if (file.mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (file.mimeType === 'application/pdf') {
      return <FileTextIcon className="h-4 w-4" />;
    }
    if (file.mimeType.includes('zip') || file.mimeType.includes('compressed')) {
      return <FileArchiveIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const getPreviewContent = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-t-lg overflow-hidden">
          <img
            src={file.path}
            alt={file.filename}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-full h-32 bg-muted rounded-t-lg">
        {getFileIcon()}
      </div>
    );
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {getPreviewContent()}
        <div className="p-3 bg-card">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">{file.size} bytes</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href={file.path} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{file.filename}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {file.mimeType.startsWith('image/') ? (
              <img
                src={file.path}
                alt={file.filename}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-muted rounded-lg">
                <div className="mb-4">{getFileIcon()}</div>
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button asChild className="mt-4">
                  <a href={file.path} target="_blank" rel="noopener noreferrer">
                    Open File
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}