import { Document, Paragraph, TextRun } from 'docx';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getChatCompletion } from './azure-openai';

export async function generateReport(topic: string): Promise<string> {
  try {
    // Get detailed report content from Azure OpenAI
    const response = await getChatCompletion([
      {
        role: "system",
        content: "Generate a detailed, professional report on the given topic. Structure it with sections, bullet points, and clear explanations."
      },
      { role: "user", content: `Create a detailed report about: ${topic}` }
    ]);

    // Create a new document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "GYM AI Engine Report",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: new Date().toLocaleDateString(),
                size: 24,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: response,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    });

    // Generate unique filename
    const filename = `report-${Date.now()}.docx`;
    const filepath = join('uploads', filename);

    // Save the document
    const buffer = await doc.save();
    writeFileSync(filepath, buffer);

    // Return the filename that can be used to download the file
    return filename;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}
