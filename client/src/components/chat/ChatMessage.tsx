import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { DownloadReportButton } from "@/components/ui/download-report-button";
import FilePreview from "@/components/document/FilePreview";
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRobot, faMessage, faBrain, faDollarSign } from "@fortawesome/pro-light-svg-icons";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  files?: any[];
  citations?: string[];
}

export default function ChatMessage({ role, content, files, citations }: ChatMessageProps) {
  // Check if the message contains a report (starts with a markdown heading)
  const isReport = role === 'assistant' && content.trim().startsWith('#');

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
          {role === 'assistant' ? (
            <div className="flex -space-x-1">
              <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
              <FontAwesomeIcon icon={faMessage} className="h-4 w-4" />
              <FontAwesomeIcon icon={faRobot} className="h-4 w-4" />
              <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" />
              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
            </div>
          ) : (
            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
          )}
        </div>
      </Avatar>

      <Card className={cn(
        "p-3 max-w-[80%]",
        role === 'assistant' 
          ? "bg-primary text-primary-foreground [&_*]:text-primary-foreground" 
          : "bg-secondary text-foreground"
      )}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {citations && citations.length > 0 && (
          <div className="mt-2 text-xs border-t border-primary-foreground/20 pt-2">
            <div className="font-medium mb-1">Sources:</div>
            <ul className="list-disc list-inside space-y-1">
              {citations.map((citation, index) => (
                <li key={index}>
                  <a 
                    href={citation} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {new URL(citation).hostname}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {files && files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <FilePreview key={index} file={file} />
            ))}
          </div>
        )}

        {isReport && (
          <DownloadReportButton content={content} />
        )}
      </Card>
    </div>
  );
}