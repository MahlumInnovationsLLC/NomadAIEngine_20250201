import { Document, Packer, Paragraph, TextRun, convertInchesToTwip, AlignmentType, HeadingLevel } from 'docx';
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
    const response = await analyzeDocument(`Generate a detailed, comprehensive analysis and report about: ${topic}.

    Please structure the response in the following format:

    # [Create a clear, professional title for the report]

    ## Executive Summary
    [Provide a concise summary of the key points]

    ## Detailed Analysis
    [Provide a thorough analysis with supporting evidence and data]

    ### Key Findings
    [List and explain major findings]

    ### Impact Assessment
    [Analyze potential impacts and implications]

    ## Recommendations
    [Provide actionable recommendations]

    ## Implementation Strategy
    [Outline steps for implementation]

    Note: Please ensure to use proper markdown formatting:
    - Use # for main headings
    - Use ## for subheadings
    - Use ### for sub-subheadings
    - Use bullet points (-)
    - Use numbering (1., 2., etc.)
    - Use **bold** for emphasis
    `);

    if (!response) {
      throw new Error("Failed to generate report content");
    }

    // Parse the markdown response
    const lines = response.split('\n');
    let docTitle = "Generated Report";

    // Find the document title
    for (const line of lines) {
      const stripped = line.trim();
      if (stripped.startsWith("# ")) {
        docTitle = stripped.substring(2).trim();
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