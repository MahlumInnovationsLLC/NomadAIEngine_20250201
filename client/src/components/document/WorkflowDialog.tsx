import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAzureUsers } from "@/hooks/use-azure-users";
import { Badge } from "@/components/ui/badge";
import { PresenceIndicator } from "@/components/ui/presence-indicator";
import { format } from "date-fns";

interface WorkflowDialogProps {
  documentId: string;
  documentTitle: string;
  trigger: React.ReactNode;
}

interface WorkflowRequest {
  documentId: string;
  type: 'review' | 'approval';
  assigneeId: string;
}

export function WorkflowDialog({ documentId, documentTitle, trigger }: WorkflowDialogProps) {
  const [type, setType] = useState<'review' | 'approval'>('review');
  const [assignee, setAssignee] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { users, isLoading: usersLoading } = useAzureUsers();

  const workflowMutation = useMutation({
    mutationFn: async (request: WorkflowRequest) => {
      const response = await fetch('/api/documents/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/workflow', documentId] });
      toast({
        title: "Request sent",
        description: `Document sent for ${type}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send ${type} request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!assignee) {
      toast({
        title: "Error",
        description: "Please select a collaborator",
        variant: "destructive",
      });
      return;
    }

    workflowMutation.mutate({
      documentId,
      type,
      assigneeId: assignee,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send for Review/Approval</DialogTitle>
          <DialogDescription>
            Select the type of request and assign a collaborator to review or approve "{documentTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Request Type</Label>
            <Select value={type} onValueChange={(value: 'review' | 'approval') => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select collaborator" />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="" disabled>Loading collaborators...</SelectItem>
                ) : users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <PresenceIndicator status={user.presence.status} />
                        <span>{user.displayName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {user.presence.status === 'online' ? (
                          <Badge variant="outline" className="bg-green-50">Online now</Badge>
                        ) : user.presence.lastSeen ? (
                          <span className="italic">
                            Last seen {format(new Date(user.presence.lastSeen), 'MMM d, h:mm a')}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={workflowMutation.isPending}
          >
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}