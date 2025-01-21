import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TicketDetails } from "@/components/TicketDetails";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportTicket } from "@db/schema";

function TicketDetailsPage() {
  const [, params] = useRoute("/admin/support/:id");
  const id = params?.id;

  const { data: ticket, isLoading } = useQuery<SupportTicket, Error>({
    queryKey: [`/api/admin/tickets/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return <TicketDetails ticket={ticket} />;
}

export default TicketDetailsPage;