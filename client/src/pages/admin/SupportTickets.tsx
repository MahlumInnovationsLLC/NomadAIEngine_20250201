import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    {ticket.submitterName}
                    <div className="text-xs text-gray-500">{ticket.submitterEmail}</div>
                  </TableCell>
                  <TableCell>{ticket.submitterCompany}</TableCell>
                  <TableCell>
                    <Badge className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[ticket.status]}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTicket && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ticket Details - #{selectedTicket.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}