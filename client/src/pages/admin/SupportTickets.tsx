import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  submitterName: string;
  submitterEmail: string;
  submitterCompany: string;
  createdAt: string;
}

export default function SupportTicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/tickets'],
    retry: 1,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
    },
  });

  const statusColors: Record<string, string> = {
    open: 'bg-green-500',
    'in_progress': 'bg-blue-500',
    'waiting_on_customer': 'bg-yellow-500',
    resolved: 'bg-gray-500',
    closed: 'bg-red-500',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Support Tickets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="space-y-4">
          {tickets?.map((ticket) => (
            <Card 
              key={ticket.id}
              className={`cursor-pointer transition-all ${selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={statusColors[ticket.status]}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  From: {ticket.submitterName} ({ticket.submitterCompany})
                </div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ticket Details */}
        {selectedTicket && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Contact Information</h3>
                <div className="text-sm text-gray-600">
                  <p>Name: {selectedTicket.submitterName}</p>
                  <p>Email: {selectedTicket.submitterEmail}</p>
                  <p>Company: {selectedTicket.submitterCompany}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Update Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedTicket.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({ ticketId: selectedTicket.id, status });
                      }}
                      disabled={updateStatusMutation.isPending}
                    >
                      {status.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement viewing/adding comments
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Comments
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
