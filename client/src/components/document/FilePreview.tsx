import { FileIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: {
    filename: string;
    mimeType: string;
    size: string;
    path: string;
  };
}

export default function FilePreview({ file }: FilePreviewProps) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-background/50">
      <FileIcon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm truncate">{file.filename}</span>
      <Button variant="ghost" size="sm" asChild>
        <a href={file.path} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
