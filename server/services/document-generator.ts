import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
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

    // Create a new document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "GYM AI Engine - Generated Report",
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 }
          }),
          new Paragraph({
            text: new Date().toLocaleDateString(),
            spacing: { after: 400 }
          }),
          ...sections.map(section => {
            const [title, ...content] = section.split('\n');
            return [
              new Paragraph({
                text: title.trim(),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                text: content.join('\n').trim(),
                spacing: { after: 200 }
              })
            ];
          }).flat()
        ]
      }]
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