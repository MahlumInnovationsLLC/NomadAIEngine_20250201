import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";

interface GenerateReportProps {
  title: string;
  content: string;
  metadata?: {
    author?: string;
    createdAt?: Date;
    tags?: string[];
  };
}

// Function to format the content for better structure
function formatReportContent(content: string): { title: string, sections: string[] } {
  const lines = content.split('\n');
  let title = "AI Generated Report";
  const sections: string[] = [];
  let currentSection = "";

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      title = line.replace('# ', '');
    } else if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = line + '\n';
    } else {
      currentSection += line + '\n';
    }
  });

  if (currentSection) {
    sections.push(currentSection.trim());
  }

  return { title, sections };
}

export async function generateWordReport({ title, content, metadata }: GenerateReportProps): Promise<Blob> {
  const { title: extractedTitle, sections } = formatReportContent(content);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: extractedTitle,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 300,
            before: 300,
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
            spacing: { after: 300 },
            alignment: AlignmentType.RIGHT,
          }),
        ] : []),
        ...sections.map(section => {
          if (section.startsWith('## ')) {
            const [heading, ...content] = section.split('\n');
            return [
              new Paragraph({
                text: heading.replace('## ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 120 },
              }),
              new Paragraph({
                text: content.join('\n'),
                spacing: { after: 120 },
              }),
            ];
          }
          return new Paragraph({
            text: section,
            spacing: { after: 120 },
          });
        }).flat(),
      ],
    }],
  });

  return Packer.toBlob(doc);
}

export async function generatePDFReport({ title, content, metadata }: GenerateReportProps): Promise<Blob> {
  const { title: extractedTitle, sections } = formatReportContent(content);
  const pdf = new jsPDF();

  // Add title
  pdf.setFontSize(24);
  pdf.text(extractedTitle, pdf.internal.pageSize.width / 2, 20, { align: 'center' });

  // Add metadata
  if (metadata) {
    pdf.setFontSize(10);
    pdf.text(
      `Generated on: ${metadata.createdAt?.toLocaleString() || new Date().toLocaleString()}`,
      pdf.internal.pageSize.width - 15,
      30,
      { align: 'right' }
    );
  }

  // Add content
  pdf.setFontSize(12);
  let yPosition = 40;

  sections.forEach((section) => {
    if (section.startsWith('## ')) {
      const [heading, ...content] = section.split('\n');

      // Add section heading
      pdf.setFont(undefined, 'bold');
      yPosition += 10;
      pdf.text(heading.replace('## ', ''), 15, yPosition);
      pdf.setFont(undefined, 'normal');

      // Add section content
      yPosition += 10;
      const contentText = content.join('\n');
      const splitText = pdf.splitTextToSize(contentText, pdf.internal.pageSize.width - 30);

      splitText.forEach((line: string) => {
        if (yPosition > pdf.internal.pageSize.height - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 15, yPosition);
        yPosition += 7;
      });
    } else {
      const splitText = pdf.splitTextToSize(section, pdf.internal.pageSize.width - 30);
      splitText.forEach((line: string) => {
        if (yPosition > pdf.internal.pageSize.height - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 15, yPosition);
        yPosition += 7;
      });
    }
  });

  return pdf.output('blob');
}

export function useReportDownload() {
  const { toast } = useToast();

  const downloadReport = async (response: string, format: 'docx' | 'pdf' = 'docx') => {
    try {
      const formattedContent = formatReportContent(response);
      const blob = format === 'docx' 
        ? await generateWordReport({
            title: formattedContent.title,
            content: response,
            metadata: {
              createdAt: new Date(),
            },
          })
        : await generatePDFReport({
            title: formattedContent.title,
            content: response,
            metadata: {
              createdAt: new Date(),
            },
          });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formattedContent.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Generated",
        description: `Your report has been generated as a ${format.toUpperCase()} file.`,
      });

      return url;
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