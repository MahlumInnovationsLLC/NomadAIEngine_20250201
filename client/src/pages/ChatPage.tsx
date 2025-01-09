import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Chat } from "@db/schema";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id?");
  const [, navigate] = useLocation();

  // Fetch chat history
  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
  });

  // Fetch current chat if ID exists
  const { data: currentChat } = useQuery<Chat>({
    queryKey: ['/api/chats', params?.id],
    enabled: !!params?.id,
  });

  const handleNewChat = () => {
    navigate('/chat');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r p-4">
        <Button
          onClick={handleNewChat}
          className="mb-4"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <div className="flex-1 overflow-auto space-y-2">
          {chats.map((chat) => (
            <div 
              key={chat.id}
              className="flex items-center group hover:bg-accent rounded-lg p-2 cursor-pointer"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <span className="flex-1 truncate text-sm text-foreground">
                {chat.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Title Header */}
        {currentChat && (
          <div className="p-4 bg-background border-b">
            <h1 className="text-xl font-semibold">{currentChat.title}</h1>
          </div>
        )}

        <ChatInterface chatId={params?.id} />
      </div>
    </div>
  );
}