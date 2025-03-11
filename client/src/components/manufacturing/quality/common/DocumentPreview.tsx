import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobUrl: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface DocumentPreviewProps {
  attachment: DocumentAttachment;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}

export function DocumentPreview({ attachment, onClose, onDelete }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const isImage = attachment.fileType.startsWith('image/');
  const isPdf = attachment.fileType === 'application/pdf';
  const isText = attachment.fileType.includes('text') || 
                 attachment.fileType.includes('json') || 
                 attachment.fileType.includes('xml');
  const isCsv = attachment.fileType.includes('csv');

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        if (attachment.blobUrl) {
          // If we already have a blob URL, use it directly
          setPreviewUrl(attachment.blobUrl);
        } else {
          // If we need to fetch the file content
          const response = await fetch(`/api/manufacturing/quality/attachments/${attachment.id}`);
          
          if (!response.ok) {
            throw new Error(`Failed to load file preview: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error('Error loading preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    // Cleanup
    return () => {
      if (previewUrl && !attachment.blobUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [attachment]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setDeleteInProgress(true);
      await onDelete();
      onClose();
    } catch (err) {
      console.error('Error deleting attachment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete attachment');
    } finally {
      setDeleteInProgress(false);
    }
  };

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] h-[90vh] p-0 flex flex-col">
      <DialogHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold">
              {attachment.fileName}
            </DialogTitle>
            <DialogDescription>
              {formatBytes(attachment.fileSize)} · {attachment.fileType} 
              {attachment.uploadedAt && ` · Uploaded ${formatDate(attachment.uploadedAt)}`}
              {attachment.uploadedBy && ` by ${attachment.uploadedBy}`}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(previewUrl || attachment.blobUrl, '_blank')}
              disabled={loading || !!error}
            >
              <FontAwesomeIcon icon="external-link" className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FontAwesomeIcon icon="xmark" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogHeader>
      
      <Separator />
      
      <div className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <FontAwesomeIcon icon="exclamation-circle" className="h-12 w-12 text-destructive mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Failed to load preview</p>
            <p className="text-xs text-destructive">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => window.open(attachment.blobUrl, '_blank')}
            >
              <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
              Download Instead
            </Button>
          </div>
        ) : (
          <div className="h-full">
            {isImage && previewUrl && (
              <div className="flex items-center justify-center h-full bg-black/5 overflow-auto">
                <img 
                  src={previewUrl} 
                  alt={attachment.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            {isPdf && previewUrl && (
              <iframe 
                src={`${previewUrl}#toolbar=0`} 
                className="w-full h-full border-0" 
                title={attachment.fileName}
              ></iframe>
            )}
            {isText && previewUrl && (
              <ScrollArea className="h-full p-6 bg-muted/30">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {/* We would load and display text content here */}
                  Loading text content...
                </pre>
              </ScrollArea>
            )}
            {!isImage && !isPdf && !isText && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-muted/50 p-8 rounded-full mb-4">
                  <FontAwesomeIcon 
                    icon={
                      attachment.fileType.includes('excel') || isCsv ? "file-excel" :
                      attachment.fileType.includes('word') ? "file-word" :
                      attachment.fileType.includes('powerpoint') ? "file-powerpoint" :
                      attachment.fileType.includes('zip') ? "file-zipper" :
                      "file"
                    } 
                    className="h-16 w-16 text-primary/70" 
                  />
                </div>
                <p className="text-lg font-semibold mb-1">{attachment.fileName}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  This file type cannot be previewed directly
                </p>
                <Button 
                  variant="outline"
                  onClick={() => window.open(previewUrl || attachment.blobUrl, '_blank')}
                >
                  <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {onDelete && (
        <>
          <Separator />
          <DialogFooter className="p-4">
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleteInProgress}
            >
              {deleteInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="trash" className="mr-2 h-4 w-4" />
                  Delete Attachment
                </>
              )}
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}

interface DocumentAttachmentsListProps {
  attachments: DocumentAttachment[];
  onViewAttachment: (attachment: DocumentAttachment) => void;
  onUploadAttachment?: (file: File) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
}

export function DocumentAttachmentsList({
  attachments,
  onViewAttachment,
  onUploadAttachment,
  isUploading = false,
  uploadProgress = 0,
  maxFileSizeMB = 10,
  allowedFileTypes,
}: DocumentAttachmentsListProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      validateAndUploadFile(event.target.files[0]);
    }
  };

  const validateAndUploadFile = (file: File) => {
    // Size validation
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${maxFileSizeMB}MB.`);
      return;
    }

    // Type validation
    if (allowedFileTypes && allowedFileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isAllowed = allowedFileTypes.some(type => {
        if (type.startsWith('.')) {
          // It's an extension check
          return `.${fileExtension}` === type.toLowerCase();
        } else {
          // It's a MIME type check
          return mimeType.includes(type);
        }
      });

      if (!isAllowed) {
        alert(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`);
        return;
      }
    }

    // Upload the file
    if (onUploadAttachment) {
      onUploadAttachment(file);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'file-image';
    if (fileType === 'application/pdf') return 'file-pdf';
    if (fileType.includes('word')) return 'file-word';
    if (fileType.includes('excel') || fileType.includes('csv')) return 'file-excel';
    if (fileType.includes('powerpoint')) return 'file-powerpoint';
    if (fileType.includes('zip')) return 'file-zipper';
    return 'file';
  };

  return (
    <div className="space-y-4">
      {onUploadAttachment && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <FontAwesomeIcon
              icon="cloud-arrow-up"
              className={`h-10 w-10 mb-2 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <p className="text-sm text-center mb-2">
              Drag & drop files here, or{' '}
              <span 
                className="text-primary cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </span>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Maximum file size: {maxFileSizeMB}MB
              {allowedFileTypes && allowedFileTypes.length > 0 && (
                <> · Allowed formats: {allowedFileTypes.join(', ')}</>
              )}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}
        </div>
      )}

      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {attachments.map((attachment) => (
            <Card 
              key={attachment.id} 
              className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onViewAttachment(attachment)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="bg-muted p-2 rounded">
                    <FontAwesomeIcon
                      icon={getFileIcon(attachment.fileType)}
                      className="h-6 w-6 text-primary/70"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={attachment.fileName}>
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(attachment.fileSize)}
                    </p>
                    {attachment.uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <FontAwesomeIcon icon="folder-open" className="h-10 w-10 mb-2" />
          <p>No attachments yet</p>
        </div>
      )}
    </div>
  );
}