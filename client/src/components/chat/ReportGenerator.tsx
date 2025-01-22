import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { useToast } from "@/hooks/use-toast";

interface GenerateReportProps {
  title: string;
  content: string;
  metadata?: {
    author?: string;
    createdAt?: Date;
    tags?: string[];
  };
}

export async function generateReport({ title, content, metadata }: GenerateReportProps): Promise<Blob> {
  const sections = content.split('\n\n');
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            after: 200,
          },
        }),
        ...(metadata ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${metadata.createdAt?.toLocaleString() || new Date().toLocaleString()}`,
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),
        ] : []),
        ...sections.map(section => 
          new Paragraph({
            text: section,
            spacing: { after: 120 },
          })
        ),
      ],
    }],
  });

  return Packer.toBlob(doc);
}

export function useReportDownload() {
  const { toast } = useToast();

  const downloadReport = async (response: string, title: string = "AI Generated Report") => {
    try {
      const blob = await generateReport({
        title,
        content: response,
        metadata: {
          createdAt: new Date(),
        },
      });

      // Upload to Azure Blob Storage
      const formData = new FormData();
      formData.append('file', blob, `${title.toLowerCase().replace(/\s+/g, '-')}.docx`);
      formData.append('title', title);

      const uploadResponse = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload report');
      }

      const { downloadUrl } = await uploadResponse.json();

      toast({
        title: "Report Generated",
        description: "Your report has been generated and is ready for download.",
      });

      return downloadUrl;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  return { downloadReport };
}
