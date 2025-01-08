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
        content: "Generate a detailed, professional report in markdown format with the following structure:\n\n" +
                "# Comprehensive Report: Latest Fitness Trends in the Industry\n\n" +
                "# Introduction\n" +
                "[Brief overview of the current state and importance of the topic]\n\n" +
                "# Overview\n" +
                "[Key points about current trends]\n\n" +
                "# Key Innovations\n" +
                "- [Innovation 1 with details]\n" +
                "- [Innovation 2 with details]\n" +
                "- [Innovation 3 with details]\n\n" +
                "Use proper markdown formatting with headers (#) and lists (-). Be thorough and analytical."
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
          // Title paragraph
          new Paragraph({
            children: [
              new TextRun({
                text: "Comprehensive Report: Latest Fitness Trends in the Industry",
                size: 48, // Larger size for main title
                bold: true,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // Date paragraph
          new Paragraph({
            children: [
              new TextRun({
                text: new Date().toLocaleDateString(),
                size: 24,
                color: "666666",
                font: "Calibri",
              }),
            ],
            spacing: { after: 400 },
          }),

          // Process each section
          ...sections.map(section => {
            const [title, ...contentLines] = section.split('\n');
            const content = contentLines.join('\n');

            const paragraphs = [];

            // Section header
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: title.trim(),
                    size: 32,
                    bold: true,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 400, after: 200 },
              })
            );

            // Process content by lines to handle bullet points and paragraphs
            let currentParagraphLines = [];
            content.split('\n').forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('-')) {
                // If we have accumulated regular paragraph lines, add them first
                if (currentParagraphLines.length > 0) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: currentParagraphLines.join('\n'),
                          size: 24,
                          font: "Calibri",
                        }),
                      ],
                      spacing: { after: 200 },
                    })
                  );
                  currentParagraphLines = [];
                }

                // Add bullet point
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: trimmedLine.substring(1).trim(),
                        size: 24,
                        font: "Calibri",
                      }),
                    ],
                    bullet: {
                      level: 0,
                    },
                    spacing: { after: 100 },
                  })
                );
              } else if (trimmedLine) {
                currentParagraphLines.push(trimmedLine);
              }
            });

            // Add any remaining paragraph lines
            if (currentParagraphLines.length > 0) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: currentParagraphLines.join('\n'),
                      size: 24,
                      font: "Calibri",
                    }),
                  ],
                  spacing: { after: 200 },
                })
              );
            }

            return paragraphs;
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