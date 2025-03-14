import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/types/manufacturing/ncr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash, faSpinner, faImage, faFilePdf, faFileAlt, faFileExcel, faFileWord, faFileCode, faFile } from '@fortawesome/pro-light-svg-icons';
import { DocumentPreview } from './DocumentPreview';

interface NCRAttachmentGalleryProps {
  attachments: Attachment[];
  onViewAttachment?: (attachment: Attachment) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  readonly?: boolean;
  title?: string;
}

export function NCRAttachmentGallery({
  attachments,
  onViewAttachment,
  onDeleteAttachment,
  readonly = false,
  title = "Attachments"
}: NCRAttachmentGalleryProps) {
  const [previewingAttachment, setPreviewingAttachment] = useState<Attachment | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  
  if (!attachments || attachments.length === 0) {
    return null;
  }
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return faImage;
    if (fileType.includes('pdf')) return faFilePdf;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return faFileExcel;
    if (fileType.includes('word') || fileType.includes('document')) return faFileWord;
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) return faFileCode;
    return faFileAlt;
  };

  const handleDeleteClick = async (attachmentId: string) => {
    if (!onDeleteAttachment) return;
    
    setDeletingAttachmentId(attachmentId);
    try {
      await onDeleteAttachment(attachmentId);
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handlePreviewClick = (attachment: Attachment) => {
    if (onViewAttachment) {
      onViewAttachment(attachment);
    } else {
      setPreviewingAttachment(attachment);
    }
  };
  
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="overflow-hidden">
              <div className="h-32 bg-muted flex items-center justify-center">
                {attachment.fileType.includes('image') ? (
                  <img 
                    src={attachment.blobUrl} 
                    alt={attachment.fileName}
                    className="h-full w-full object-cover object-center" 
                  />
                ) : (
                  <FontAwesomeIcon 
                    icon={getFileIcon(attachment.fileType)} 
                    className="h-12 w-12 text-muted-foreground"
                  />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={attachment.fileName}>
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(attachment.fileSize / 1024)} KB
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewClick(attachment)}
                    >
                      <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                    </Button>
                    {!readonly && onDeleteAttachment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(attachment.id)}
                        disabled={deletingAttachmentId === attachment.id}
                      >
                        {deletingAttachmentId === attachment.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewingAttachment && (
        <DocumentPreview
          document={previewingAttachment}
          isOpen={!!previewingAttachment}
          onClose={() => setPreviewingAttachment(null)}
        />
      )}
    </>
  );
}