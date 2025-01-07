import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Users } from 'lucide-react';

interface DocumentEditorProps {
  documentId: number;
  userId: string;
}

interface DocumentOperation {
  type: 'insert' | 'delete' | 'update';
  position: number;
  content?: string;
  length?: number;
  documentId: number;
  userId: string;
}

export default function DocumentEditor({ documentId, userId }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: document } = useQuery({
    queryKey: ['/api/documents', documentId],
    onSuccess: (data) => {
      setContent(data.content);
      setTitle(data.title);
    },
  });

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket(`ws://${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'join',
        documentId,
        userId
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'operation':
          applyOperation(message.operation);
          break;
        case 'user_joined':
          setCollaborators(prev => [...prev, message.userId]);
          toast({
            title: 'Collaborator joined',
            description: `User ${message.userId} joined the document`,
          });
          break;
        case 'user_left':
          setCollaborators(prev => prev.filter(id => id !== message.userId));
          toast({
            title: 'Collaborator left',
            description: `User ${message.userId} left the document`,
          });
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      toast({
        variant: "destructive",
        title: "Connection lost",
        description: "Trying to reconnect...",
      });
    };

    return () => {
      ws.close();
    };
  }, [documentId, userId]);

  const applyOperation = (operation: DocumentOperation) => {
    setContent(prevContent => {
      switch (operation.type) {
        case 'insert':
          return prevContent.slice(0, operation.position) + 
                 operation.content! + 
                 prevContent.slice(operation.position);
        case 'delete':
          return prevContent.slice(0, operation.position) + 
                 prevContent.slice(operation.position + operation.length!);
        default:
          return prevContent;
      }
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const operation: DocumentOperation = {
      type: 'insert',
      position: 0,
      content: newContent,
      documentId,
      userId
    };

    setContent(newContent);
    wsRef.current?.send(JSON.stringify({
      type: 'operation',
      operation
    }));
  };

  const saveDocument = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
      toast({
        title: 'Document saved',
        description: 'Your changes have been saved successfully',
      });
    },
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold w-auto"
          placeholder="Document Title"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm text-muted-foreground">
              {collaborators.length} active
            </span>
          </div>
          <Button
            onClick={() => saveDocument.mutate()}
            disabled={saveDocument.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-[500px] p-4 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Start typing..."
      />

      {!isConnected && (
        <div className="mt-2 text-sm text-red-500">
          Connection lost. Trying to reconnect...
        </div>
      )}
    </Card>
  );
}
