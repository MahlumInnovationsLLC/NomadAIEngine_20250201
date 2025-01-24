import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle, AlignmentType, WidthType, HeadingLevel } from "docx";
import { join } from "path";
import { promises as fs } from "fs";

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  date: string;
}

interface Achievement {
  name: string;
  description: string;
  completedAt?: string;
  progress: number;
}

export async function generateHealthReport(
  userId: string,
  metrics: HealthMetric[],
  achievements: Achievement[]
): Promise<string> {
  // Create Document
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 32,
            bold: true,
            color: "000000",
          },
          paragraph: {
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER
          },
        },
        {
          id: "Subtitle",
          name: "Subtitle",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 24,
            color: "666666",
          },
          paragraph: {
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER
          },
        },
        {
          id: "Heading",
          name: "Heading",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "000000",
          },
          paragraph: {
            spacing: { before: 400, after: 200 },
          },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        }
      },
      children: [
        // Title
        new Paragraph({
          text: "Personal Health & Wellness Report",
          style: "Title"
        }),

        // Date
        new Paragraph({
          text: `Generated on ${new Date().toLocaleDateString()}`,
          style: "Subtitle"
        }),

        // Health Metrics Section
        new Paragraph({
          text: "Current Health Metrics",
          style: "Heading"
        }),

        // Metrics Table
        new Table({
          width: {
            size: 8500,
            type: WidthType.DXA,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          },
          rows: [
            // Header Row
            new TableRow({
              children: [
                new TableCell({
                  width: {
                    size: 3000,
                    type: WidthType.DXA,
                  },
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Metric", bold: true })],
                    alignment: AlignmentType.CENTER
                  })],
                }),
                new TableCell({
                  width: {
                    size: 2750,
                    type: WidthType.DXA,
                  },
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Value", bold: true })],
                    alignment: AlignmentType.CENTER
                  })],
                }),
                new TableCell({
                  width: {
                    size: 2750,
                    type: WidthType.DXA,
                  },
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Date", bold: true })],
                    alignment: AlignmentType.CENTER
                  })],
                }),
              ],
            }),
            // Data Rows
            ...metrics.map(
              (metric) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        text: metric.name,
                        alignment: AlignmentType.LEFT
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        text: `${metric.value} ${metric.unit}`,
                        alignment: AlignmentType.CENTER
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        text: new Date(metric.date).toLocaleDateString(),
                        alignment: AlignmentType.CENTER
                      })],
                    }),
                  ],
                })
            ),
          ],
        }),

        // Achievements Section
        new Paragraph({
          text: "Wellness Achievements",
          style: "Heading"
        }),

        ...achievements.map(
          (achievement) =>
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: `${achievement.name}\n`,
                  bold: true,
                  size: 24,
                }),
                new TextRun({
                  text: `${achievement.description}\n`,
                  size: 24,
                }),
                new TextRun({
                  text: achievement.completedAt
                    ? `Completed on ${new Date(achievement.completedAt).toLocaleDateString()}`
                    : `Progress: ${achievement.progress}%`,
                  size: 24,
                  color: achievement.completedAt ? "2E7D32" : "1976D2",
                }),
              ],
            })
        ),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: "\n\nThis report was automatically generated by the Wellness Management Platform.",
              size: 20,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),
      ],
    }],
  });

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  // Generate unique filename
  const filename = `health-report-${userId}-${Date.now()}.docx`;
  const filepath = join(uploadsDir, filename);

  // Save document
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filepath, buffer);

  return filename;
}