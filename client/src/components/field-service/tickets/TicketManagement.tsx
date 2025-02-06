import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { ServiceTicket } from "@/types/field-service";
import { AITicketAnalysis } from "./AITicketAnalysis";

export function TicketManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<ServiceTicket[]>({
    queryKey: ['/api/field-service/tickets'],
  });

  // Mutation for assigning technician
  const assignTechnician = useMutation({
    mutationFn: async ({ ticketId, technicianId }: { ticketId: string, technicianId: string }) => {
      const response = await fetch(`/api/field-service/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId }),
      });
      if (!response.ok) throw new Error('Failed to assign technician');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-service/tickets'] });
      toast({
        title: "Success",
        description: "Technician assigned successfully",
      });
      setSelectedTicket(null);
    },
  });

  // Mutation for updating priority
  const updatePriority = useMutation({
    mutationFn: async ({ ticketId, priority }: { ticketId: string, priority: ServiceTicket['priority'] }) => {
      const response = await fetch(`/api/field-service/tickets/${ticketId}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (!response.ok) throw new Error('Failed to update priority');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/field-service/tickets'] });
      toast({
        title: "Success",
        description: "Ticket priority updated successfully",
      });
    },
  });

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = !searchQuery || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.productInfo.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Service Tickets</h2>
          <p className="text-muted-foreground">
            AI-powered ticket management and assignment system
          </p>
        </div>
        <Button className="gap-2">
          <FontAwesomeIcon icon="plus" className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FontAwesomeIcon icon="filter" className="mr-2 h-4 w-4" />
              Status Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('open')}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('resolved')}>
              Resolved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
              Closed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets?.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono">{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>{ticket.customer.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      ticket.priority === 'critical' ? 'destructive' :
                      ticket.priority === 'high' ? 'default' :
                      ticket.priority === 'medium' ? 'secondary' :
                      'outline'
                    }>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.aiAnalysis && (
                      <Badge variant="secondary">
                        {(ticket.aiAnalysis.priorityScore * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <FontAwesomeIcon icon="robot" className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Analysis Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ticket Analysis - {selectedTicket?.id}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <AITicketAnalysis
              ticket={selectedTicket}
              onAssign={(technicianId) => {
                assignTechnician.mutate({
                  ticketId: selectedTicket.id,
                  technicianId,
                });
              }}
              onOverridePriority={(priority) => {
                updatePriority.mutate({
                  ticketId: selectedTicket.id,
                  priority,
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}