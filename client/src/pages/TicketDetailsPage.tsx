import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TicketDetails } from "@/components/TicketDetails";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportTicket } from "@db/schema";

function TicketDetailsPage() {
  const [, params] = useRoute("/admin/support/:id");
  const id = params?.id;

  const { data: ticket, isLoading, error } = useQuery<SupportTicket, Error>({
    queryKey: [`/api/admin/tickets/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="w-full h-[600px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading ticket: {error.message}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        Ticket not found
      </div>
    );
  }

  return <TicketDetails ticket={ticket} />;
}

export default TicketDetailsPage;