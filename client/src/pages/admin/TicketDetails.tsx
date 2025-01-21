import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, ArrowLeft, Paperclip } from "lucide-react";
import { useLocation } from "wouter";

interface Comment {
  id: number;
  content: string;
  authorId: string;
  createdAt: string;
  isInternal: boolean;
}

interface TicketDetails {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  submitterName: string;
  submitterEmail: string;
  submitterCompany: string;
  createdAt: string;
  attachmentUrl?: string;
  comments: Comment[];
}

export default function TicketDetails({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  const { data: ticket, isLoading } = useQuery<TicketDetails>({
    queryKey: [`/api/admin/tickets/${id}`],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (comment: { content: string; isInternal: boolean }) => {
      const response = await fetch(`/api/admin/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/tickets/${id}`] });
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been successfully added to the ticket.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/admin/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/tickets/${id}`] });
      toast({
        title: "Status Updated",
        description: "Ticket status has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      content: newComment,
      isInternal: isInternalNote,
    });
  };

  if (isLoading) {
    return <div>Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/admin/support")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">#{ticket.id}: {ticket.title}</CardTitle>
                <CardDescription>
                  Submitted by {ticket.submitterName} from {ticket.submitterCompany}
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <Badge variant="outline">{ticket.priority}</Badge>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <Badge
                        variant={
                          ticket.status === "open"
                            ? "default"
                            : ticket.status === "in_progress"
                            ? "secondary"
                            : ticket.status === "resolved"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_on_customer">
                      Waiting on Customer
                    </SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{ticket.description}</p>
                {ticket.attachmentUrl && (
                  <div className="mt-4">
                    <a
                      href={ticket.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      View Attachment
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Comments</h3>
                <div className="space-y-4 mb-6">
                  {ticket.comments?.map((comment) => (
                    <Card key={comment.id} className={comment.isInternal ? "bg-gray-50" : ""}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {comment.isInternal && (
                              <Badge variant="outline">Internal Note</Badge>
                            )}
                            <span className="font-medium">
                              {comment.authorId}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <MessageCircle className="h-5 w-5" />
                    <h4 className="font-medium">Add Response</h4>
                  </div>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your response here..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="internal-note"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="internal-note" className="text-sm">
                        Mark as internal note
                      </label>
                    </div>
                    <Button type="submit" disabled={!newComment.trim()}>
                      Send Response
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
