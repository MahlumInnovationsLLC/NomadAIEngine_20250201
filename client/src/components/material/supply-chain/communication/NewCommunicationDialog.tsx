import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";
import type { SupplierCommunicationHistory } from "@/types/material";

interface NewCommunicationDialogProps {
  supplierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'message' | 'meeting' | 'document';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  document: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

type CommunicationFormData = {
  title: string;
  content: string;
  priority: SupplierCommunicationHistory['priority'];
  attachments: File[];
  meetingTime?: string;
  meetingDuration?: number;
  meetingLocation?: string;
};

export function NewCommunicationDialog({
  supplierId,
  open,
  onOpenChange,
  type
}: NewCommunicationDialogProps) {
  const [formData, setFormData] = useState<CommunicationFormData>({
    title: '',
    content: '',
    priority: 'medium',
    attachments: [],
    meetingTime: type === 'meeting' ? '' : undefined,
    meetingDuration: type === 'meeting' ? 30 : undefined,
    meetingLocation: type === 'meeting' ? 'online' : undefined,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationFormData) => {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'attachments') {
          (value as File[]).forEach(file => {
            formDataToSend.append('attachments', file);
          });
        } else if (value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });
      formDataToSend.append('supplierId', supplierId);
      formDataToSend.append('type', type);

      const xhr = new XMLHttpRequest();
      const promise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      });

      xhr.open('POST', '/api/material/supplier-communications');
      xhr.send(formDataToSend);

      return promise;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/material/supplier-communications'] });
      onOpenChange(false);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to create ${type}.`,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = [...ALLOWED_FILE_TYPES.document, ...ALLOWED_FILE_TYPES.image].includes(extension as any);
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `File ${file.name} is not supported.`,
        variant: "destructive",
      });
    }
    if (!isValidSize) {
      toast({
        title: "File too large",
        description: `File ${file.name} exceeds 10MB limit.`,
        variant: "destructive",
      });
    }

    return isValidType && isValidSize;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    const files = 'dataTransfer' in e 
      ? Array.from(e.dataTransfer.files)
      : Array.from(e.target.files || []);

    const validFiles = files.filter(validateFile);

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'meeting' && !formData.meetingTime) {
      toast({
        title: "Error",
        description: "Please select a meeting time.",
        variant: "destructive",
      });
      return;
    }
    createCommunicationMutation.mutate(formData);
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'message' ? 'New Message' :
             type === 'meeting' ? 'Schedule Meeting' :
             'Upload Document'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={
                type === 'message' ? 'Message subject' :
                type === 'meeting' ? 'Meeting title' :
                'Document title'
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={value => setFormData(prev => ({ 
                ...prev, 
                priority: value as SupplierCommunicationHistory['priority']
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'meeting' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="meetingTime">Meeting Time</Label>
                <Input
                  id="meetingTime"
                  type="datetime-local"
                  value={formData.meetingTime}
                  onChange={e => setFormData(prev => ({ ...prev, meetingTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingDuration">Duration (minutes)</Label>
                <Input
                  id="meetingDuration"
                  type="number"
                  value={formData.meetingDuration}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    meetingDuration: parseInt(e.target.value) 
                  }))}
                  min={15}
                  step={15}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">
              {type === 'message' ? 'Message' : 
               type === 'meeting' ? 'Agenda' : 
               'Description'}
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                handleFileChange(e);
              }}
            >
              <Input
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="file-upload"
                accept={[...ALLOWED_FILE_TYPES.document, ...ALLOWED_FILE_TYPES.image].join(',')}
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FontAwesomeIcon icon={["fas", "upload"]} className="h-8 w-8 text-muted-foreground" />
                  <span>
                    Drag & drop files here or <span className="text-primary">browse</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Max file size: 10MB
                  </span>
                </div>
              </Label>
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <FontAwesomeIcon icon={["fas", "times"]} className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="w-full" />
          )}

          <Button 
            type="submit"
            className="w-full"
            disabled={createCommunicationMutation.isPending}
          >
            {createCommunicationMutation.isPending ? (
              <>
                <FontAwesomeIcon icon={["fas", "spinner"]} className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              type === 'message' ? 'Send Message' :
              type === 'meeting' ? 'Schedule Meeting' :
              'Upload Document'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}