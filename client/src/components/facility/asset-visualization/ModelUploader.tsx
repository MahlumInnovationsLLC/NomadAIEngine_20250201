import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";

interface ModelUploaderProps {
  onUpload?: (file: File) => void;
  onSuccess?: (url: string) => void;
}

export default function ModelUploader({ onUpload, onSuccess }: ModelUploaderProps) {
  const [uploading, setUploading] = useState(false);
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

    try {
      setUploading(true);
      onUpload?.(file);

      const formData = new FormData();
      formData.append('model', file);

      const response = await fetch('/api/upload/model', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      onSuccess?.(url);

      toast({
        title: "Upload successful",
        description: "3D model has been uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload model",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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
                  icon={['fal', 'cloud-arrow-up']} 
                  className="h-8 w-8 text-muted-foreground"
                />
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload 3D model'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports GLB and GLTF formats
                </p>
              </div>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
