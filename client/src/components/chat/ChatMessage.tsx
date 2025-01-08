import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import FilePreview from "@/components/document/FilePreview";
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  files?: any[];
}

export default function ChatMessage({ role, content, files }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        role === 'assistant' ? "flex-row" : "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8">
        <div className={cn(
          "w-full h-full flex items-center justify-center text-xs font-medium",
          role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}>
          {role === 'assistant' ? 'AI' : 'You'}
        </div>
      </Avatar>

      <Card className={cn(
        "p-3 max-w-[80%]",
        role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-secondary"
      )}>
        <div className="prose prose-sm dark:prose-invert max-w-none text-white">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {files && files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <FilePreview key={index} file={file} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}