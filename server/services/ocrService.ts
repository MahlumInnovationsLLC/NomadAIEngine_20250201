import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: number[];
  category?: string;
  severity?: string;
}

export class OCRService {
  private documentClient: DocumentAnalysisClient;
  private visionClient: ComputerVisionClient;

  constructor() {
    const endpoint = process.env.NOMAD_AZURE_VISION_ENDPOINT || "";
    const key = process.env.NOMAD_AZURE_VISION_KEY || "";

    this.documentClient = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(key)
    );

    this.visionClient = new ComputerVisionClient(
      new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
      endpoint
    );
  }

  async analyzeDocument(fileBuffer: Buffer): Promise<{
    results: OCRResult[];
    analytics: {
      issueTypes: { [key: string]: number };
      severityDistribution: { [key: string]: number };
      confidence: number;
    };
  }> {
    const poller = await this.documentClient.beginAnalyzeDocument(
      "prebuilt-document",
      fileBuffer
    );
    const result = await poller.pollUntilDone();

    const ocrResults: OCRResult[] = [];
    const analytics = {
      issueTypes: {} as { [key: string]: number },
      severityDistribution: {} as { [key: string]: number },
      confidence: 0,
    };

    if (result.pages) {
      for (const page of result.pages) {
        for (const line of page.lines || []) {
          // Extract confidence from spans if available
          const spans = line.spans || [];
          const avgConfidence = spans.length > 0
            ? spans.reduce((sum, span) => sum + (span.confidence || 0), 0) / spans.length
            : 0.8; // Default confidence if not available

          // Extract polygon points for bounding box
          const polygonPoints = line.polygon || [];
          const boundingBox = polygonPoints.reduce((arr: number[], point) => {
            arr.push(point.x, point.y);
            return arr;
          }, []);

          const text = line.content;

          // AI-based categorization of issues
          const category = await this.categorizeIssue(text);
          const severity = await this.determineSeverity(text);

          const ocrResult: OCRResult = {
            text,
            confidence: avgConfidence,
            boundingBox,
            category,
            severity,
          };

          ocrResults.push(ocrResult);

          // Update analytics
          analytics.issueTypes[category] = (analytics.issueTypes[category] || 0) + 1;
          analytics.severityDistribution[severity] = (analytics.severityDistribution[severity] || 0) + 1;
          analytics.confidence += avgConfidence;
        }
      }
    }

    // Calculate average confidence
    analytics.confidence = analytics.confidence / (ocrResults.length || 1);

    return { results: ocrResults, analytics };
  }

  private async categorizeIssue(text: string): Promise<string> {
    const categories = [
      "Material Defect",
      "Assembly Issue",
      "Quality Standard Violation",
      "Process Deviation",
      "Equipment Malfunction",
    ];

    const textLower = text.toLowerCase();

    // Improved categorization logic
    const categoryKeywords = {
      "Material Defect": ["material", "defect", "damage", "crack", "scratch", "contamination"],
      "Assembly Issue": ["assembly", "fit", "alignment", "connection", "mounting"],
      "Quality Standard Violation": ["standard", "specification", "requirement", "tolerance"],
      "Process Deviation": ["process", "procedure", "workflow", "deviation", "variation"],
      "Equipment Malfunction": ["equipment", "machine", "tool", "malfunction", "failure"]
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return category;
      }
    }

    return "Other";
  }

  private async determineSeverity(text: string): Promise<string> {
    const severityIndicators = {
      Critical: ["critical", "severe", "immediate", "unsafe", "danger", "hazard", "emergency"],
      Major: ["major", "significant", "important", "serious", "high priority"],
      Minor: ["minor", "low", "minimal", "negligible", "cosmetic"],
    };

    const textLower = text.toLowerCase();

    for (const [severity, indicators] of Object.entries(severityIndicators)) {
      if (indicators.some(indicator => textLower.includes(indicator))) {
        return severity;
      }
    }

    return "Minor"; // Default severity
  }
}

export const ocrService = new OCRService();