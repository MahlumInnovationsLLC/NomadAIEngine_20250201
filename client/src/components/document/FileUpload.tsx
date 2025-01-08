import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FolderTree } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  onClose: () => void;
}

interface FolderStructure {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("/");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders = [] } = useQuery<FolderStructure[]>({
    queryKey: ['/api/documents/folders'],
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files[]', file);
      });
      formData.append('folder', selectedFolder);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      onUpload(files);
      setFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FolderTree className="h-4 w-4" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="/">/</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.path}>
                  {folder.path}
                </option>
              ))}
            </select>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 text-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              multiple
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>

            <p className="text-sm text-muted-foreground mt-2">
              or drag and drop files here
            </p>
          </div>

          {files.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Selected Files</h4>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">
                      <span className="text-muted-foreground">{selectedFolder}/</span>
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={files.length === 0}>
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}