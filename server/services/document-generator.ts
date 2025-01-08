import { Document, Packer, Paragraph, HeadingLevel, TextRun, convertInchesToTwip, AlignmentType } from 'docx';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getChatCompletion } from './azure-openai';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

export async function generateReport(topic: string): Promise<string> {
  try {
    // Get detailed report content from Azure OpenAI
    const response = await getChatCompletion([
      {
        role: "system",
        content: "Generate a detailed, professional report in markdown format. Include these sections: Executive Summary, Key Findings, Detailed Analysis, Recommendations, and Conclusion. Use proper markdown formatting with headers (#) and lists (-). Be thorough and analytical."
      },
      { role: "user", content: `Create a comprehensive report about: ${topic}` }
    ]);

    // Parse the markdown response and create document sections
    const sections = response.split('\n#').filter(Boolean);

    // Create a new document with proper styling
    const doc = new Document({
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
          // Title
          new Paragraph({
            text: "GYM AI Engine - Generated Report",
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 },
            alignment: AlignmentType.CENTER,
            style: {
              font: {
                name: "Calibri",
                size: 36,
              },
            },
          }),
          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: new Date().toLocaleDateString(),
                font: {
                  name: "Calibri",
                  size: 24,
                  color: "666666",
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Content sections
          ...sections.map(section => {
            const [title, ...content] = section.split('\n');

            // Process content to handle markdown elements
            const processedContent = content.join('\n')
              .replace(/\*\*(.*?)\*\*/g, '${bold}$1${normal}') // Bold text
              .replace(/- (.*?)(?=\n|$)/g, '• $1\n')  // Bullet points
              .replace(/(\d+)\. (.*?)(?=\n|$)/g, '$1. $1\n'); // Numbered lists

            return [
              // Section title
              new Paragraph({
                children: [
                  new TextRun({
                    text: title.trim(),
                    font: {
                      name: "Calibri",
                      size: 28,
                      bold: true,
                    },
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),
              // Section content
              new Paragraph({
                children: processedContent.split('${bold}').map((part, index) => {
                  if (index % 2 === 0) {
                    return new TextRun({
                      text: part.split('${normal}')[0],
                      font: {
                        name: "Calibri",
                        size: 24,
                      },
                    });
                  } else {
                    return new TextRun({
                      text: part.split('${normal}')[0],
                      bold: true,
                      font: {
                        name: "Calibri",
                        size: 24,
                      },
                    });
                  }
                }),
                spacing: { after: 200 },
              }),
            ];
          }).flat(),
        ],
      }],
    });

    // Generate unique filename
    const filename = `report-${Date.now()}.docx`;
    const filepath = join(uploadsDir, filename);

    // Create buffer and write to file
    const buffer = await Packer.toBuffer(doc);
    writeFileSync(filepath, buffer);

    return filename;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}