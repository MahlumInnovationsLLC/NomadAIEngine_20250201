import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { SupportTicket } from "@db/schema";

interface TicketDetailsProps {
  ticket: SupportTicket;
}

interface ResponseFormData {
  message: string;
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<ResponseFormData>();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/tickets/${ticket.id}`] });
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
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">Title</Label>
            <p className="text-sm mt-1">{ticket.title}</p>
          </div>
          <div>
            <Label className="font-semibold">Description</Label>
            <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Status</Label>
              <p className="text-sm mt-1 capitalize">{ticket.status}</p>
            </div>
            <div>
              <Label className="font-semibold">Priority</Label>
              <p className="text-sm mt-1 capitalize">{ticket.priority}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Submitter</Label>
              <p className="text-sm mt-1">{ticket.submitterName}</p>
            </div>
            <div>
              <Label className="font-semibold">Company</Label>
              <p className="text-sm mt-1">{ticket.submitterCompany}</p>
            </div>
          </div>
          <div>
            <Label className="font-semibold">Email</Label>
            <p className="text-sm mt-1">{ticket.submitterEmail}</p>
          </div>
          <div>
            <Label className="font-semibold">Created At</Label>
            <p className="text-sm mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
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
                {...register("message", { required: "A response message is required" })}
                className="min-h-[150px] mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Response"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}