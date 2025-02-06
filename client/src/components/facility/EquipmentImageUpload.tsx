import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EquipmentImageUploadProps {
  equipmentId: string;
  currentImageUrl?: string;
  onUploadComplete?: (imageUrl: string) => void;
}

export function EquipmentImageUpload({
  equipmentId,
  currentImageUrl,
  onUploadComplete
}: EquipmentImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/equipment/${equipmentId}/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/equipment/${equipmentId}`] });
      if (onUploadComplete) {
        onUploadComplete(data.url);
      }
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload file
    uploadMutation.mutate(file);

    // Cleanup object URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="space-y-4">
      {previewUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <img
            src={previewUrl}
            alt="Equipment preview"
            className="h-full w-full object-contain"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
          className="hidden"
          id={`equipment-image-${equipmentId}`}
        />
        <Button
          variant="secondary"
          onClick={() => document.getElementById(`equipment-image-${equipmentId}`)?.click()}
          disabled={uploadMutation.isPending}
        >
          <FontAwesomeIcon 
            icon={uploadMutation.isPending ? "spinner" : "upload"} 
            className={`mr-2 h-4 w-4 ${uploadMutation.isPending ? "animate-spin" : ""}`}
          />
          {uploadMutation.isPending ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {uploadMutation.isError && (
        <Alert variant="destructive">
          <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
          <AlertDescription>
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : "Failed to upload image"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
