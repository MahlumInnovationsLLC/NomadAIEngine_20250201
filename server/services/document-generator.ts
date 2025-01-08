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
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Comprehensive Report: Latest Fitness Trends in the Industry",
                font: {
                  name: "Calibri",
                  bold: true,
                  size: 32,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
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
            alignment: AlignmentType.LEFT,
            spacing: { after: 400 },
          }),
          // Content sections
          ...sections.map(section => {
            const [title, ...content] = section.split('\n');

            return [
              // Section title
              new Paragraph({
                children: [
                  new TextRun({
                    text: title.trim(),
                    font: {
                      name: "Calibri",
                      bold: true,
                      size: 28,
                    },
                  }),
                ],
                spacing: { before: 400, after: 200 },
              }),
              // Section content
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.join('\n')
                      .replace(/\*\*(.*?)\*\*/g, '$1') // Handle bold text
                      .replace(/^\s*-\s*/gm, '• ') // Convert dashes to bullets
                      .trim(),
                    font: {
                      name: "Calibri",
                      size: 24,
                    },
                  }),
                ],
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