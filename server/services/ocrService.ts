import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: number[];
  category?: string;
  severity?: string;
  department?: string;
  isTable?: boolean;
  tableCells?: {
    rowIndex: number;
    columnIndex: number;
    text: string;
    confidence: number;
  }[];
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
    try {
      console.log('Starting document analysis...');
      const poller = await this.documentClient.beginAnalyzeDocument(
        "prebuilt-document",
        fileBuffer
      );
      const result = await poller.pollUntilDone();
      console.log('Document analysis completed');

      const ocrResults: OCRResult[] = [];
      const analytics = {
        issueTypes: {} as { [key: string]: number },
        severityDistribution: {} as { [key: string]: number },
        confidence: 0,
      };

      if (result.pages) {
        for (const page of result.pages) {
          for (const line of page.lines || []) {
            // Calculate confidence based on available data
            const spans = line.spans || [];
            let avgConfidence = 0.8; // Default confidence

            if (spans.length > 0) {
              const confidenceSum = spans.reduce((sum, span) => {
                // Safely access confidence value with a default
                const spanConfidence = typeof span.confidence === 'number' 
                  ? span.confidence 
                  : 0.8;
                return sum + spanConfidence;
              }, 0);
              avgConfidence = confidenceSum / spans.length;
            }

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
      analytics.confidence = ocrResults.length > 0 
        ? analytics.confidence / ocrResults.length 
        : 0.8;

      console.log('Analysis complete:', {
        resultCount: ocrResults.length,
        averageConfidence: analytics.confidence,
        categories: Object.keys(analytics.issueTypes)
      });

      return { results: ocrResults, analytics };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async categorizeIssue(text: string): Promise<string> {
    const categoryKeywords = {
      "Material Defect": ["material", "defect", "damage", "crack", "scratch", "contamination"],
      "Assembly Issue": ["assembly", "fit", "alignment", "connection", "mounting"],
      "Quality Standard Violation": ["standard", "specification", "requirement", "tolerance"],
      "Process Deviation": ["process", "procedure", "workflow", "deviation", "variation"],
      "Equipment Malfunction": ["equipment", "machine", "tool", "malfunction", "failure"]
    };

    const textLower = text.toLowerCase();

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