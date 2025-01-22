import { Document, Packer, Paragraph, TextRun, convertInchesToTwip, AlignmentType, HeadingLevel, LevelFormat } from 'docx';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { analyzeDocument } from './azure/openai_service';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

export async function generateReport(topic: string): Promise<string> {
  try {
    // Get detailed report content from Azure OpenAI
    const response = await analyzeDocument(`Generate a detailed, comprehensive analysis and report about: ${topic}`);

    if (!response) {
      throw new Error("Failed to generate report content");
    }

    // Parse the markdown response
    const lines = response.split('\n');
    let docTitle = "Generated Report";

    // Create document with proper styling
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "multilevel-list",
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }
                }
              }
            }]
          },
          {
            reference: "numbered-list",
            levels: [{
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }
                }
              }
            }]
          }
        ]
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [
          // Process each line for headers, bullets, and paragraphs
          ...lines.map(line => {
            const stripped = line.trim();
            if (!stripped) {
              return new Paragraph({
                spacing: { after: 200 }
              });
            }

            // Handle headers
            if (stripped.startsWith("### ")) {
              return new Paragraph({
                text: stripped.substring(4).trim(),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 400, after: 200 },
                style: 'Heading3'
              });
            } else if (stripped.startsWith("## ")) {
              return new Paragraph({
                text: stripped.substring(3).trim(),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
                style: 'Heading2'
              });
            } else if (stripped.startsWith("# ")) {
              docTitle = stripped.substring(2).trim();
              return new Paragraph({
                text: docTitle,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                style: 'Heading1'
              });
            }

            // Handle bullet points
            if (stripped.startsWith("- ")) {
              return new Paragraph({
                numbering: {
                  reference: "multilevel-list",
                  level: 0,
                },
                text: stripped.substring(2).trim(),
                spacing: { after: 200 }
              });
            }

            // Handle numbered lists
            const numberedMatch = stripped.match(/^(\d+)\.\s+(.+)/);
            if (numberedMatch) {
              return new Paragraph({
                numbering: {
                  reference: "numbered-list",
                  level: 0,
                },
                text: numberedMatch[2].trim(),
                spacing: { after: 200 }
              });
            }

            // Regular paragraph with potential bold text
            const boldParts = stripped.split(/\*\*(.*?)\*\*/g);
            if (boldParts.length > 1) {
              return new Paragraph({
                children: boldParts.map((part, index) => 
                  new TextRun({
                    text: part,
                    bold: index % 2 === 1,
                  })
                ),
                spacing: { after: 200 }
              });
            }

            // Regular paragraph
            return new Paragraph({
              text: stripped,
              spacing: { after: 200 }
            });
          }),
        ],
      }],
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 24
            }
          }
        },
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Calibri",
              size: 36,
              bold: true
            }
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Calibri",
              size: 32,
              bold: true
            }
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Calibri",
              size: 28,
              bold: true
            }
          }
        ]
      }
    });

    // Generate a clean filename from the title
    const safeTitle = docTitle.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${safeTitle}-${timestamp}.docx`;
    const filepath = join(uploadsDir, filename);

    // Generate the document
    const buffer = await Packer.toBuffer(doc);
    writeFileSync(filepath, buffer);

    return filename;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}