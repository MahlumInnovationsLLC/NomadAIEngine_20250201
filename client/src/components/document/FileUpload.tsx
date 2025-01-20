import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import Font Awesome


interface FileUploadProps {
  onUpload: (files: File[], version: string, notes: string) => void;
  onClose: () => void;
  currentVersion?: string;
}

export default function FileUpload({ onUpload, onClose, currentVersion = "1.0" }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      validateAndAddFiles(droppedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Add your file type validation here
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB size limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !version.trim() || !notes.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide all required information",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(files, version, notes);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: "Files have been uploaded successfully",
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate next version based on current version
  const suggestedNextVersion = (() => {
    const parts = currentVersion.split('.');
    if (parts.length === 2) {
      const [major, minor] = parts.map(Number);
      return `${major}.${minor + 1}`;
    }
    return "1.0";
  })();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Version</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Version</label>
              <Input
                placeholder={suggestedNextVersion}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${files.length > 0 ? 'bg-accent/50' : ''}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              multiple
              className="hidden"
            />

            <div className="flex flex-col items-center gap-2">
              <FontAwesomeIcon icon="upload" className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground/50'}`} /> {/* Replaced Upload icon */}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Choose Files
              </Button>
              <p className="text-sm text-muted-foreground">
                or drag and drop files here
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Selected Files</h4>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-accent/50 p-2 rounded-md">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <FontAwesomeIcon icon="xmark" className="h-4 w-4" /> {/* Replaced X icon */}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Version Notes</label>
            <Textarea
              placeholder="Describe the changes in this version..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={files.length === 0 || !version || !notes || isUploading}
            >
              {isUploading ? (
                <>
                  <span className="mr-2">Uploading...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="check" className="mr-2 h-4 w-4" /> {/* Replaced Check icon */}
                  Upload Version
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}