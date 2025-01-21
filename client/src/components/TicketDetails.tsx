import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface TicketDetailsProps {
  ticket: {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    submitterName: string;
    submitterEmail: string;
    submitterCompany: string;
    createdAt: string;
  };
}

interface ResponseFormData {
  message: string;
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<ResponseFormData>();

  const sendResponse = useMutation({
    mutationFn: async (data: ResponseFormData) => {
      const response = await fetch(`/api/admin/tickets/${ticket.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send response');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent successfully.",
      });
      reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ResponseFormData) => {
    setIsLoading(true);
    try {
      await sendResponse.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <p className="text-sm">{ticket.title}</p>
          </div>
          <div>
            <Label>Description</Label>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <p className="text-sm capitalize">{ticket.status}</p>
            </div>
            <div>
              <Label>Priority</Label>
              <p className="text-sm capitalize">{ticket.priority}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Submitter</Label>
              <p className="text-sm">{ticket.submitterName}</p>
            </div>
            <div>
              <Label>Company</Label>
              <p className="text-sm">{ticket.submitterCompany}</p>
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm">{ticket.submitterEmail}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Response</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="message">Response Message</Label>
              <Textarea
                id="message"
                placeholder="Type your response here..."
                {...register("message", { required: true })}
                className="min-h-[150px]"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Response"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
