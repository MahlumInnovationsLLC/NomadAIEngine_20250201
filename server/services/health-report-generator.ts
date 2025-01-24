import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle } from "docx";
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
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "Personal Health & Wellness Report",
              size: 32,
              bold: true,
            }),
          ],
          spacing: { after: 400 },
          alignment: "CENTER",
        }),

        // Date
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on ${new Date().toLocaleDateString()}`,
              size: 24,
            }),
          ],
          spacing: { after: 400 },
          alignment: "CENTER",
        }),

        // Health Metrics Section
        new Paragraph({
          children: [
            new TextRun({
              text: "Current Health Metrics",
              size: 28,
              bold: true,
            }),
          ],
          spacing: { after: 300 },
        }),

        // Metrics Table
        new Table({
          rows: [
            // Header Row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })],
                }),
              ],
            }),
            // Data Rows
            ...metrics.map(
              (metric) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: metric.name })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: `${metric.value} ${metric.unit}` })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: new Date(metric.date).toLocaleDateString() })],
                    }),
                  ],
                })
            ),
          ],
          width: {
            size: 100,
            type: "pct",
          },
        }),

        // Achievements Section
        new Paragraph({
          children: [
            new TextRun({
              text: "Wellness Achievements",
              size: 28,
              bold: true,
            }),
          ],
          spacing: { before: 400, after: 300 },
        }),

        ...achievements.map(
          (achievement) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${achievement.name}`,
                  size: 24,
                  bold: true,
                }),
                new TextRun({
                  text: `\n${achievement.description}\n`,
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
              spacing: { after: 200 },
            })
        ),
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
