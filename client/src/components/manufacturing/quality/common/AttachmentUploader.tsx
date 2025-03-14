import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faSpinner, faFile, faXmark, faFileZipper, faFileImage, faFilePdf, faFileWord, faFileExcel } from '@fortawesome/pro-light-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface FileItem {
  file: File;
  id: string;
  progress: number;
  uploading: boolean;
  error?: string;
  uploaded?: boolean;
}

interface AttachmentUploaderProps {
  parentId: string;
  parentType: 'ncr' | 'mrb' | 'inspection' | 'capa';
  onSuccess: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  multiple?: boolean;
}

export function AttachmentUploader({ 
  parentId, 
  parentType, 
  onSuccess, 
  onCancel, 
  disabled = false,
  multiple = true
}: AttachmentUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (filename: string): IconProp => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return faFilePdf;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return faFileImage;
      case 'doc':
      case 'docx':
        return faFileWord;
      case 'xls':
      case 'xlsx':
        return faFileExcel;
      case 'zip':
      case 'rar':
      case '7z':
        return faFileZipper;
      default:
        return faFile;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles: FileItem[] = Array.from(files).map(file => ({
        file,
        id: crypto.randomUUID(),
        progress: 0,
        uploading: false
      }));
      
      setSelectedFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);
    }
    
    // Clear input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFile = async (fileItem: FileItem): Promise<boolean> => {
    if (!fileItem.file || !parentId) return false;

    // Update file status
    setSelectedFiles(prev => prev.map(item => 
      item.id === fileItem.id ? { ...item, uploading: true, progress: 0 } : item
    ));

    // Create a progress simulation
    const interval = setInterval(() => {
      setSelectedFiles(prev => prev.map(item => {
        if (item.id === fileItem.id && item.progress < 90) {
          return { ...item, progress: item.progress + 10 };
        }
        return item;
      }));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);

      let endpoint = '';
      switch (parentType) {
        case 'ncr':
          endpoint = `/api/manufacturing/quality/ncrs/${parentId}/attachments`;
          break;
        case 'mrb':
          endpoint = `/api/manufacturing/quality/mrbs/${parentId}/attachments`;
          break;
        case 'inspection':
          endpoint = `/api/manufacturing/quality/inspections/${parentId}/attachments`;
          break;
        case 'capa':
          endpoint = `/api/manufacturing/quality/capas/${parentId}/attachments`;
          break;
        default:
          throw new Error('Invalid parent type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload attachment');
      }

      // Update file status
      setSelectedFiles(prev => prev.map(item => 
        item.id === fileItem.id ? { ...item, uploading: false, progress: 100, uploaded: true } : item
      ));
      
      return true;

    } catch (error) {
      clearInterval(interval);
      console.error('Upload error:', error);
      
      // Update file status with error
      setSelectedFiles(prev => prev.map(item => 
        item.id === fileItem.id ? { 
          ...item, 
          uploading: false, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : item
      ));
      
      return false;
    }
  };

  const handleUploadAll = async () => {
    // Filter out already uploaded files
    const filesToUpload = selectedFiles.filter(f => !f.uploaded && !f.uploading);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    // Upload files one by one
    for (const fileItem of filesToUpload) {
      const success = await uploadFile(fileItem);
      if (success) successCount++;
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} ${successCount === 1 ? 'attachment' : 'attachments'} uploaded successfully`
      });
      
      // Remove successfully uploaded files after 2 seconds
      setTimeout(() => {
        setSelectedFiles(prev => prev.filter(file => !file.uploaded));
      }, 2000);
      
      // Notify parent component
      onSuccess();
    }

    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          onChange={handleFileChange}
          disabled={isUploading || disabled}
        />
        <Button
          variant="outline"
          onClick={handleSelectFile}
          disabled={isUploading || disabled}
        >
          <FontAwesomeIcon icon={faFile} className="mr-2 h-4 w-4" />
          {multiple ? 'Select Files' : 'Select File'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {multiple ? 'You can select multiple files' : 'Select a single file to upload'}
        </span>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="border rounded-md divide-y">
            {selectedFiles.map((fileItem) => (
              <div 
                key={fileItem.id} 
                className={`p-3 flex items-center justify-between ${fileItem.uploaded ? 'bg-green-50 animate-pulse' : fileItem.error ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <FontAwesomeIcon 
                    icon={getFileIcon(fileItem.file.name)} 
                    className={`h-5 w-5 ${fileItem.error ? 'text-destructive' : fileItem.uploaded ? 'text-green-500' : 'text-primary'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(fileItem.file.size / 1024)} KB
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-destructive mt-1">{fileItem.error}</p>
                    )}
                  </div>
                </div>
                
                {fileItem.uploading ? (
                  <div className="w-24">
                    <Progress value={fileItem.progress} className="h-2" />
                  </div>
                ) : fileItem.uploaded ? (
                  <span className="text-xs font-medium text-green-600">Uploaded</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(fileItem.id)}
                    className="text-muted-foreground h-8 w-8 p-0"
                    disabled={isUploading}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 justify-end">
            {onCancel && !isUploading && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isUploading}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || selectedFiles.length === 0 || selectedFiles.every(f => f.uploaded) || disabled}
            >
              {isUploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="mr-2 h-4 w-4" />
                  Upload {selectedFiles.filter(f => !f.uploaded).length > 1 ? 'All' : ''} Attachment{selectedFiles.filter(f => !f.uploaded).length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}