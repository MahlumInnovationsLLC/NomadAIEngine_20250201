import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Attachment } from "@/types/manufacturing/ncr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFilePdf, faFileWord, faFileExcel, faFileCode, faFileAlt } from '@fortawesome/pro-light-svg-icons';
import { Button } from '@/components/ui/button';

interface DocumentPreviewProps {
  document: Attachment;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ document: attachment, isOpen, onClose }: DocumentPreviewProps) {
  const isImage = attachment.fileType.includes('image');
  const isPdf = attachment.fileType.includes('pdf');
  
  const getFileIcon = () => {
    if (attachment.fileType.includes('pdf')) return faFilePdf;
    if (attachment.fileType.includes('excel') || attachment.fileType.includes('spreadsheet')) return faFileExcel;
    if (attachment.fileType.includes('word') || attachment.fileType.includes('document')) return faFileWord;
    if (attachment.fileType.includes('text') || attachment.fileType.includes('json') || attachment.fileType.includes('xml')) return faFileCode;
    return faFileAlt;
  };
  
  const handleDownload = () => {
    // Create a temporary anchor element to trigger download
    const a = window.document.createElement('a');
    a.href = attachment.blobUrl;
    a.download = attachment.fileName;
    a.style.display = 'none';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-lg font-semibold truncate pr-6">{attachment.fileName}</DialogTitle>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <FontAwesomeIcon icon={faDownload} className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden mt-4">
          {isImage ? (
            <div className="flex items-center justify-center h-full w-full bg-muted rounded">
              <img 
                src={attachment.blobUrl} 
                alt={attachment.fileName} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : isPdf ? (
            <iframe 
              src={attachment.blobUrl} 
              title={attachment.fileName}
              className="w-full h-[60vh] border-0 rounded"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[40vh] bg-muted rounded p-8 text-center">
              <FontAwesomeIcon icon={getFileIcon()} className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Preview not available</p>
              <p className="text-sm text-muted-foreground mb-4">
                This file type cannot be previewed directly in the browser.
              </p>
              <Button onClick={handleDownload}>Download to view</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}