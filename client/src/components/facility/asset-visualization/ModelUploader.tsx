import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";

interface ModelUploaderProps {
  onUpload?: (file: File) => void;
  onSuccess?: (modelData: { url: string, modelId: string }) => void;
}

export default function ModelUploader({ onUpload, onSuccess }: ModelUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('model', file);
      formData.append('metadata', JSON.stringify({
        name: file.name,
        type: '3d-model',
        format: file.name.split('.').pop()?.toLowerCase(),
        uploadedAt: new Date().toISOString()
      }));

      const response = await fetch('/api/facility/upload-model', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload model');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: "3D model has been uploaded successfully"
      });
      onSuccess?.(data);
      setProgress(0);
      setUploading(false);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload model",
        variant: "destructive"
      });
      setProgress(0);
      setUploading(false);
    }
  });

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

      // Create XHR for upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/facility/upload-model');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentage));
        }
      };

      // Create FormData and append file
      const formData = new FormData();
      formData.append('model', file);
      formData.append('metadata', JSON.stringify({
        name: file.name,
        type: '3d-model',
        format: file.name.split('.').pop()?.toLowerCase(),
        uploadedAt: new Date().toISOString()
      }));

      // Use XHR to upload with progress
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          uploadMutation.mutate(file);
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
                  icon={['fal', 'cloud-upload-alt']} 
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