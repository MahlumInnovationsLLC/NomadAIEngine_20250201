import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import FilePreview from "@/components/document/FilePreview";
import ReactMarkdown from 'react-markdown';
import { useReportDownload } from "./ReportGenerator";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useState } from "react";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  files?: any[];
  citations?: string[];
}

export default function ChatMessage({ role, content, files, citations }: ChatMessageProps) {
  const { downloadReport } = useReportDownload();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (format: 'docx' | 'pdf') => {
    try {
      setIsGenerating(true);
      await downloadReport(content, format);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if the content appears to be a report (contains headers or sections)
  const isReport = content.includes('# ') || content.includes('## ');

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
        role === 'assistant' 
          ? "bg-primary text-primary-foreground [&_*]:text-primary-foreground" 
          : "bg-secondary text-foreground"
      )}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {isReport && role === 'assistant' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              onClick={() => handleDownload('docx')} 
              variant="secondary" 
              className="gap-2 text-foreground hover:text-foreground"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FontAwesomeIcon icon="download" className="h-4 w-4" />
              )}
              Download Word Document
            </Button>
            <Button 
              onClick={() => handleDownload('pdf')} 
              variant="secondary" 
              className="gap-2 text-foreground hover:text-foreground"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FontAwesomeIcon icon="download" className="h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        )}

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
      </Card>
    </div>
  );
}