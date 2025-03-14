import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faSpinner, faFile } from '@fortawesome/pro-light-svg-icons';

interface AttachmentUploaderProps {
  parentId: string;
  parentType: 'ncr' | 'mrb' | 'inspection' | 'capa';
  onSuccess: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function AttachmentUploader({ 
  parentId, 
  parentType, 
  onSuccess, 
  onCancel, 
  disabled = false 
}: AttachmentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !parentId) return;

    setUploading(true);
    setProgress(0);

    // Create a progress simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload attachment');
      }

      clearInterval(interval);
      setProgress(100);
      
      toast({
        title: "Success",
        description: "Attachment uploaded successfully"
      });

      // Reset after successful upload
      setSelectedFile(null);
      setProgress(0);
      
      // Notify parent component
      onSuccess();

    } catch (error) {
      clearInterval(interval);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload attachment",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading || disabled}
        />
        <Button
          variant="outline"
          onClick={handleSelectFile}
          disabled={uploading || disabled}
        >
          <FontAwesomeIcon icon={faFile} className="mr-2 h-4 w-4" />
          Select File
        </Button>
        {selectedFile && (
          <div className="flex-1 text-sm truncate">
            {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="space-y-2">
          {uploading && (
            <Progress value={progress} className="h-2" />
          )}
          <div className="flex gap-2 justify-end">
            {onCancel && !uploading && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || disabled}
            >
              {uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="mr-2 h-4 w-4" />
                  Upload Attachment
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}