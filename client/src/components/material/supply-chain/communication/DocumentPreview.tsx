import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface DocumentPreviewProps {
  url: string;
  filename: string;
  fileType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({
  url,
  filename,
  fileType,
  open,
  onOpenChange,
}: DocumentPreviewProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  const isPDF = /\.pdf$/i.test(filename);
  const isText = /\.(txt|md|csv)$/i.test(filename);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{filename}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={url} download={filename} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isImage && (
            <div className="relative aspect-video">
              <img
                src={url}
                alt={filename}
                className="rounded-lg object-contain w-full h-full"
              />
            </div>
          )}
          {isPDF && (
            <iframe
              src={`${url}#view=FitH`}
              className="w-full h-[70vh] rounded-lg"
              title={filename}
            />
          )}
          {isText && (
            <pre className="p-4 bg-muted rounded-lg max-h-[70vh] overflow-auto">
              <code>Loading text content...</code>
            </pre>
          )}
          {!isImage && !isPDF && !isText && (
            <div className="flex flex-col items-center justify-center py-8">
              <FontAwesomeIcon icon="file" className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Preview not available for this file type
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a href={url} download={filename} target="_blank" rel="noopener noreferrer">
                  Download to view
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
