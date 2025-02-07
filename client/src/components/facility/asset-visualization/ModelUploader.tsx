import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ModelUploaderProps {
  onUpload?: (file: File) => void;
  onSuccess?: (url: string) => void;
}

export default function ModelUploader({ onUpload, onSuccess }: ModelUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a GLB or GLTF file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      onUpload?.(file);

      const formData = new FormData();
      formData.append('model', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/model', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentage));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const { url } = JSON.parse(xhr.responseText);
          onSuccess?.(url);
          toast({
            title: "Upload successful",
            description: "3D model has been uploaded successfully"
          });
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Upload failed');
      };

      xhr.send(formData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload model",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload 3D Model</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              id="model-upload"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label 
              htmlFor="model-upload" 
              className="cursor-pointer block"
            >
              <div className="space-y-2">
                <FontAwesomeIcon 
                  icon={['fas', 'cloud-upload-alt']} 
                  className="h-8 w-8 text-muted-foreground"
                />
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload 3D model'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports GLB and GLTF formats (max 50MB)
                </p>
              </div>
            </label>
          </div>
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress}% uploaded
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}