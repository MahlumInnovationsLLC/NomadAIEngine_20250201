import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TicketDetails } from "@/components/TicketDetails";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportTicket } from "@db/schema";

function TicketDetailsPage() {
  const [, params] = useRoute("/admin/support/:id");
  const id = params?.id;

  const { data: ticket, isLoading, error } = useQuery<SupportTicket>({
    queryKey: [`/api/admin/tickets/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="w-full h-[600px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Error loading ticket: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        No ticket found with ID: {id}
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <TicketDetails ticket={ticket} />
    </div>
  );
}

export default TicketDetailsPage;