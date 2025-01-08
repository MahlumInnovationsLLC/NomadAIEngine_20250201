import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatHeaderProps {
  chatId?: string;
}

export default function ChatHeader({ chatId }: ChatHeaderProps) {
  const { data: chat, isLoading } = useQuery({
    queryKey: ['/api/chats', chatId],
    enabled: !!chatId,
  });

  if (!chatId) {
    return <h1 className="text-xl font-semibold">New Chat</h1>;
  }

  if (isLoading) {
    return <Skeleton className="h-8 w-48" />;
  }

  return (
    <h1 className="text-xl font-semibold">
      {chat?.title || 'Untitled Chat'}
    </h1>
  );
}
