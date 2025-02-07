
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatHistorySidebar from "@/components/chat/ChatHistorySidebar";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useState } from "react";
import { useChatHistory } from "@/hooks/use-chat-history";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id?");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { messages, clearMessages } = useChatHistory(params?.id);

  const handleNewChat = () => {
    // Only show confirmation if there are messages
    if (messages.length > 0) {
      setShowConfirmDialog(true);
    } else {
      window.location.href = '/chat';
    }
  };

  const confirmNewChat = () => {
    clearMessages();
    setShowConfirmDialog(false);
    window.location.href = '/chat';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="py-6 border-b">
        <div className="container px-4">
          <h1 className="text-3xl font-bold mb-2">Chat Interface</h1>
          <p className="text-muted-foreground">
            Engage in conversations and manage your chat history.
          </p>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Chat history sidebar */}
        <ChatHistorySidebar />

        {/* Main chat area with New Chat button */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-background">
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          <div className="flex-1">
            <ChatInterface chatId={params?.id} />
          </div>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start New Chat?</AlertDialogTitle>
              <AlertDialogDescription>
                Starting a new chat will clear your current conversation. This action cannot be undone. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmNewChat}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
