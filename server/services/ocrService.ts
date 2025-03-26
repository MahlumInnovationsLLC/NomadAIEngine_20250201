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

  async analyzeDocument(fileBuffer: Buffer, inspectionType?: string): Promise<{
    results: OCRResult[];
    analytics: {
      issueTypes: { [key: string]: number };
      severityDistribution: { [key: string]: number };
      confidence: number;
    };
  }> {
    try {
      console.log('Starting document analysis...');
      console.log('Inspection type:', inspectionType || 'not specified');
      
      // First try to analyze as a table/form document for better table detection
      const formPoller = await this.documentClient.beginAnalyzeDocument(
        "prebuilt-layout",
        fileBuffer
      );
      const formResult = await formPoller.pollUntilDone();
      
      // Then analyze as a general document for better text extraction
      const textPoller = await this.documentClient.beginAnalyzeDocument(
        "prebuilt-document",
        fileBuffer
      );
      const textResult = await textPoller.pollUntilDone();
      
      console.log('Document analysis completed');

      const ocrResults: OCRResult[] = [];
      const analytics = {
        issueTypes: {} as { [key: string]: number },
        severityDistribution: {} as { [key: string]: number },
        confidence: 0,
      };
      
      // Process tables first (from layout analysis)
      if (formResult.tables && formResult.tables.length > 0) {
        console.log(`Detected ${formResult.tables.length} tables in the document`);
        
        for (const table of formResult.tables) {
          console.log(`Processing table with ${table.rowCount} rows and ${table.columnCount} columns`);
          
          // Create a table result
          const tableCells: {
            rowIndex: number;
            columnIndex: number;
            text: string;
            confidence: number;
          }[] = [];
          
          // Determine the header row to use for categorization
          const headerRow = table.cells
            .filter(cell => cell.rowIndex === 0)
            .map(cell => cell.content);
            
          console.log('Table headers:', headerRow);
          
          // Extract cells
          for (const cell of table.cells) {
            tableCells.push({
              rowIndex: cell.rowIndex,
              columnIndex: cell.columnIndex,
              text: cell.content,
              confidence: 0.9 // High confidence for table structure
            });
          }
          
          // Try to identify the department column and the issue type column
          let departmentColIndex = -1;
          let issueTypeColIndex = -1;
          let severityColIndex = -1;
          
          headerRow.forEach((header, index) => {
            const headerLower = header.toLowerCase();
            if (headerLower.includes('department') || headerLower.includes('dept') || headerLower.includes('area')) {
              departmentColIndex = index;
            }
            if (headerLower.includes('issue') || headerLower.includes('defect') || headerLower.includes('problem')) {
              issueTypeColIndex = index;
            }
            if (headerLower.includes('severity') || headerLower.includes('priority') || headerLower.includes('critical')) {
              severityColIndex = index;
            }
          });
          
          // Extract a summary of the table for categorization
          const tableText = tableCells.map(cell => cell.text).join(' ');
          const category = await this.categorizeIssue(tableText);
          const severity = await this.determineSeverity(tableText);
          const department = await this.determineDepartment(tableText, inspectionType);
          
          // Calculate average confidence for the table
          const avgConfidence = tableCells.reduce((sum, cell) => sum + cell.confidence, 0) / tableCells.length;
          
          const tableResult: OCRResult = {
            text: `Table with ${table.rowCount} rows and ${table.columnCount} columns`,
            confidence: avgConfidence,
            boundingBox: [],  // We don't have the polygon for the whole table
            category,
            severity,
            department,
            isTable: true,
            tableCells
          };
          
          ocrResults.push(tableResult);
          
          // Update analytics
          analytics.issueTypes[category] = (analytics.issueTypes[category] || 0) + 1;
          analytics.severityDistribution[severity] = (analytics.severityDistribution[severity] || 0) + 1;
          analytics.confidence += avgConfidence;
        }
      }

      // Process text from document analysis
      if (textResult.pages) {
        for (const page of textResult.pages) {
          for (const line of page.lines || []) {
            // Skip lines that are likely part of tables we already processed
            if (ocrResults.some(result => result.isTable && result.tableCells?.some(cell => cell.text === line.content))) {
              continue;
            }
            
            // Calculate confidence based on available data
            const spans = line.spans || [];
            let avgConfidence = 0.8; // Default confidence

            if (spans.length > 0) {
              const confidenceSum = spans.reduce((sum, span) => {
                // DocumentSpan doesn't have confidence in typings 
                // Use a default confidence value of 0.85 for OCR text recognition
                const spanConfidence = 0.85;
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
            const department = await this.determineDepartment(text, inspectionType);

            const ocrResult: OCRResult = {
              text,
              confidence: avgConfidence,
              boundingBox,
              category,
              severity,
              department
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
  
  private async determineDepartment(text: string, inspectionType?: string): Promise<string> {
    // Department mapping based on inspection type and text analysis
    const departmentKeywords = {
      "Manufacturing": ["manufacturing", "production", "assembly", "fabrication"],
      "Quality Control": ["quality", "inspection", "qc", "qa", "test"],
      "Engineering": ["engineering", "design", "development", "specification"],
      "Electrical": ["electrical", "electronic", "wiring", "circuit", "power"],
      "Mechanical": ["mechanical", "structural", "physical", "hardware"],
      "Materials": ["material", "composition", "raw material", "supply"],
      "Safety": ["safety", "hazard", "protection", "risk", "compliance"]
    };
    
    // Specific departments that might be mentioned in context of inspection types
    const inspectionTypeDepartments: Record<string, string[]> = {
      "in-process": ["Manufacturing", "Assembly", "Production"],
      "final-qc": ["Quality Control", "Test", "Verification"],
      "executive-review": ["Executive", "Management", "Program"],
      "pdi": ["Pre-Delivery", "Shipping", "Final Verification"]
    };
    
    // First check if inspection type gives us context
    if (inspectionType && inspectionTypeDepartments[inspectionType]) {
      // Return the primary department for this inspection type
      return inspectionTypeDepartments[inspectionType][0];
    }
    
    // Then check for explicit department mentions in the text
    const textLower = text.toLowerCase();
    
    for (const [department, keywords] of Object.entries(departmentKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return department;
      }
    }
    
    // Default based on most common department for inspections
    return "Quality Control";
  }
}

export const ocrService = new OCRService();