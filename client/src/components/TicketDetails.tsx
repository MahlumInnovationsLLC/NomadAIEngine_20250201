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
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Ticket #{ticket.id} - {ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <p className="text-sm bg-muted/50 p-4 rounded-md whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Status</Label>
              <p className="text-sm capitalize bg-muted/50 p-2 rounded-md inline-block">{ticket.status}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Priority</Label>
              <p className="text-sm capitalize bg-muted/50 p-2 rounded-md inline-block">{ticket.priority}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Submitted By</Label>
              <p className="text-sm">{ticket.submitterName}</p>
              <p className="text-sm text-muted-foreground">{ticket.submitterEmail}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Company</Label>
              <p className="text-sm">{ticket.submitterCompany}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Created</Label>
            <p className="text-sm">{new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Send Response</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-semibold">
                Response Message
              </Label>
              <Textarea
                id="message"
                placeholder="Type your response here..."
                {...register("message", { required: "A response message is required" })}
                className="min-h-[200px] resize-y"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Sending..." : "Send Response"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}