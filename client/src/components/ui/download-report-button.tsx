import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useState } from "react";

interface DownloadReportButtonProps {
  content: string;
}

export function DownloadReportButton({ content }: DownloadReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: content }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();

      // Create a download link and trigger it
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={handleDownload}
      disabled={isLoading}
      className="mt-2 text-foreground bg-secondary hover:bg-secondary/90"
    >
      <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
      {isLoading ? "Generating..." : "Download Report"}
    </Button>
  );
}