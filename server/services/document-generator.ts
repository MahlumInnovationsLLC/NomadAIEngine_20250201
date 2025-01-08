import { Document, Packer, Paragraph, TextRun, convertInchesToTwip, AlignmentType, HeadingLevel } from 'docx';
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
        content: "Generate a highly detailed, comprehensive report in markdown format. The report should be extensive and thorough, covering all aspects in depth. Use the following structure and markdown formatting:\n\n" +
                "# [Generate a clear, professional title that reflects the content]\n\n" +
                "# Introduction\n" +
                "[Detailed introduction with context and importance]\n\n" +
                "## Market Overview\n" +
                "[In-depth market analysis with statistics and trends]\n\n" +
                "## Current Landscape\n" +
                "[Comprehensive overview of current state]\n\n" +
                "# Key Innovations\n" +
                "## Innovation 1: [Title]\n" +
                "- [Detailed point 1]\n" +
                "- [Detailed point 2]\n" +
                "### Technical Details\n" +
                "[In-depth technical analysis]\n\n" +
                "## Innovation 2: [Title]\n" +
                "- [Detailed points]\n\n" +
                "Use proper markdown formatting:\n" +
                "- # for main sections\n" +
                "- ## for subsections\n" +
                "- ### for detailed subsections\n" +
                "- **text** for bold emphasis\n" +
                "- - for bullet points\n" +
                "- 1. for numbered lists\n\n" +
                "Provide extensive detail, statistics, and analysis in each section. Include market trends, adoption rates, technical specifications, and impact analysis. The report should be comprehensive enough to serve as a detailed industry analysis document."
      },
      { role: "user", content: `Create a comprehensive report about: ${topic}` }
    ]);

    // Parse the markdown response
    const lines = response.split('\n');
    let docTitle = "Generated Report";

    // Find the document title from any level header
    for (const line of lines) {
      const stripped = line.trim();
      if (stripped.startsWith("# ")) {
        docTitle = stripped.substring(2).trim();
        break;
      } else if (stripped.startsWith("## ")) {
        docTitle = stripped.substring(3).trim();
        break;
      } else if (stripped.startsWith("### ")) {
        docTitle = stripped.substring(4).trim();
        break;
      }
    }

    // Create document with proper styling
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
          // Process each line for headers, bullets, and paragraphs
          ...lines.map(line => {
            const stripped = line.trim();
            if (!stripped) {
              return new Paragraph({
                spacing: { after: 100 },
              });
            }

            // Handle headers
            if (stripped.startsWith("### ")) {
              return new Paragraph({
                children: [
                  new TextRun({
                    text: stripped.substring(4).trim(),
                    size: 28,
                    bold: true,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 240, after: 120 },
                heading: HeadingLevel.HEADING_3,
              });
            } else if (stripped.startsWith("## ")) {
              return new Paragraph({
                children: [
                  new TextRun({
                    text: stripped.substring(3).trim(),
                    size: 32,
                    bold: true,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 320, after: 160 },
                heading: HeadingLevel.HEADING_2,
              });
            } else if (stripped.startsWith("# ")) {
              return new Paragraph({
                children: [
                  new TextRun({
                    text: stripped.substring(2).trim(),
                    size: 36,
                    bold: true,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 400, after: 200 },
                heading: HeadingLevel.HEADING_1,
              });
            }

            // Handle bullet points
            if (stripped.startsWith("- ")) {
              const content = stripped.substring(2).trim();
              return new Paragraph({
                children: content.split("**").map((segment, index) => 
                  new TextRun({
                    text: segment,
                    size: 24,
                    bold: index % 2 === 1,
                    font: "Calibri",
                  })
                ),
                bullet: { level: 0 },
                spacing: { after: 120 },
              });
            }

            // Handle numbered lists
            const numberedMatch = stripped.match(/^\d+\.\s+(.+)/);
            if (numberedMatch) {
              const content = numberedMatch[1].trim();
              return new Paragraph({
                children: content.split("**").map((segment, index) => 
                  new TextRun({
                    text: segment,
                    size: 24,
                    bold: index % 2 === 1,
                    font: "Calibri",
                  })
                ),
                numbering: {
                  reference: "default-numbering",
                  level: 0,
                },
                spacing: { after: 120 },
              });
            }

            // Regular paragraph with bold text support
            return new Paragraph({
              children: stripped.split("**").map((segment, index) => 
                new TextRun({
                  text: segment,
                  size: 24,
                  bold: index % 2 === 1,
                  font: "Calibri",
                })
              ),
              spacing: { after: 120 },
            });
          }),
        ],
      }],
    });

    // Generate a clean filename from the title
    const safeTitle = docTitle.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${safeTitle}-${timestamp}.docx`;
    const filepath = join(uploadsDir, filename);

    const buffer = await Packer.toBuffer(doc);
    writeFileSync(filepath, buffer);

    return filename;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}