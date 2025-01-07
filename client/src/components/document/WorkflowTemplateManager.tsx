import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Edit, Trash2 } from "lucide-react";
import { HelpBubble } from "@/components/ui/HelpBubble";

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'review' | 'approval' | 'update' | 'custom';
}

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isPublic: boolean;
}

export default function WorkflowTemplateManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery<WorkflowTemplate[]>({
    queryKey: ['/api/workflow-templates'],
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<WorkflowTemplate>) => {
      const response = await fetch('/api/workflow-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Template created",
        description: "Your workflow template has been created successfully.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplate.mutate({
      name: templateName,
      description: templateDescription,
      isPublic,
      steps: [], // Initial empty steps, will be configured later
    });
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setIsPublic(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Workflow Templates</h2>
        <HelpBubble
          content={
            <div className="space-y-2">
              <p>Create custom document workflows with AI-powered analysis stages.</p>
              <p>- Automatic content summarization</p>
              <p>- Sentiment analysis</p>
              <p>- Key points extraction</p>
            </div>
          }
          side="left"
        >
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </HelpBubble>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{template.name}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <div className="space-y-2">
                {template.steps.map((step) => (
                  <div key={step.id} className="text-sm">
                    • {step.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Create Workflow Template
              <HelpBubble
                content="Define steps for document processing, including AI analysis phases"
                showIcon={true}
                side="right"
              />
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Document Review Process"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe the purpose and steps of this workflow..."
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="public" className="flex flex-col">
                  <span>Make Public</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Allow other users to use this template
                  </span>
                </Label>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!templateName.trim()}>
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}