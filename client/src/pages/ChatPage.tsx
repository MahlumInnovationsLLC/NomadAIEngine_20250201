import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import ChatInterface from "@/components/chat/ChatInterface";
import FileUpload from "@/components/document/FileUpload";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText } from "lucide-react";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id?");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleNewChat = () => {
    navigate('/chat');
  };

  const handleFileUpload = async (files: File[]) => {
    // Handle file upload
    setShowFileUpload(false);
    toast({
      title: "Files uploaded",
      description: `Successfully uploaded ${files.length} files`,
    });
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

        <div className="flex-1 overflow-auto">
          {/* Chat history would go here */}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface chatId={params?.id} />

        {showFileUpload && (
          <FileUpload
            onUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
          />
        )}

        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-4 right-4"
          onClick={() => setShowFileUpload(true)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>
    </div>
  );
}