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
  location?: string;
  isTable?: boolean;
  isStructuredTableRow?: boolean;
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
    // Get credentials from environment variables - specifically for Form Recognizer
    const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || 
                     process.env.NOMAD_AZURE_FORM_RECOGNIZER_ENDPOINT || 
                     process.env.NOMAD_AZURE_VISION_ENDPOINT || "";
                     
    const key = process.env.AZURE_FORM_RECOGNIZER_KEY || 
                process.env.NOMAD_AZURE_FORM_RECOGNIZER_KEY || 
                process.env.NOMAD_AZURE_VISION_KEY || "";

    // Log initialization (without revealing full credentials)
    console.log(`Initializing OCR Service with Azure Form Recognizer endpoint: ${endpoint ? endpoint.substring(0, 15) + '...' : 'MISSING ENDPOINT'}`);
    console.log(`Azure Form Recognizer API key present: ${key ? 'Yes' : 'No - Missing API Key'}`);

    if (!endpoint || !key) {
      console.error('Missing Azure Form Recognizer API credentials - OCR functionality will not work properly');
    }

    try {
      // Initialize the Document Analysis client for form recognition and layout analysis
      this.documentClient = new DocumentAnalysisClient(
        endpoint,
        new AzureKeyCredential(key)
      );

      // Initialize the Computer Vision client for text recognition
      this.visionClient = new ComputerVisionClient(
        new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
        endpoint
      );
      
      console.log('Azure Form Recognizer clients initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure Form Recognizer clients:', error);
      // Initialize with empty clients that will be checked before use
      this.documentClient = null as any;
      this.visionClient = null as any;
    }
  }
  
  // Helper methods for file type detection
  private isPDF(buffer: Buffer): boolean {
    // Check for PDF signature (%PDF-)
    return buffer.length > 4 && buffer.slice(0, 4).toString() === '%PDF';
  }
  
  private isImage(buffer: Buffer): boolean {
    // Check for common image signatures (JPEG, PNG)
    if (buffer.length < 8) return false;
    
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return true;
    
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    
    return false;
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
      console.log('Document buffer size:', fileBuffer.length, 'bytes');
      
      // Determine document type for optimized processing
      const isPdf = this.isPDF(fileBuffer);
      const isImg = this.isImage(fileBuffer);
      console.log(`Document type detection: PDF=${isPdf}, Image=${isImg}`);
      
      // Validate client availability first
      if (!this.documentClient || !this.visionClient) {
        console.error('OCR clients not properly initialized - Azure credentials may be missing');
        throw new Error('OCR service not properly configured: Azure credentials missing or invalid');
      }
      
      console.log('Analyzing document layout with Form Recognizer...');
      
      // First try to analyze as a table/form document for better table detection
      let formResult;
      try {
        // Select model based on file type
        const modelId = isPdf ? "prebuilt-layout" : "prebuilt-document";
        console.log(`Using model ${modelId} for initial document analysis based on file type`);
        
        const formPoller = await this.documentClient.beginAnalyzeDocument(
          modelId, // Use the appropriate model based on file type
          fileBuffer
        );
        formResult = await formPoller.pollUntilDone();
        console.log('Layout analysis completed successfully');
      } catch (layoutError) {
        console.error('Error during layout analysis:', layoutError);
        console.log('Proceeding with text-only analysis');
        formResult = { tables: [] };
      }
      
      console.log('Analyzing document text with Document Intelligence...');
      
      // Then analyze as a general document for better text extraction
      let textResult;
      try {
        // For image files, use the read model for better OCR
        // For PDFs and other docs, use the prebuilt-document model
        const modelId = isImg ? "prebuilt-read" : "prebuilt-document";
        console.log(`Using model ${modelId} for text extraction based on file type`);
        
        const textPoller = await this.documentClient.beginAnalyzeDocument(
          modelId, // Use the appropriate model based on file type
          fileBuffer
        );
        textResult = await textPoller.pollUntilDone();
        console.log('Text analysis completed successfully');
      } catch (textError) {
        console.error('Error during text analysis:', textError);
        throw new Error('Failed to analyze document text: ' + 
          (textError instanceof Error ? textError.message : 'Unknown error'));
      }
      
      console.log('Document analysis completed successfully');

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
          
          // Specifically identify Issue Description, Location, and Assignment columns
          let issueDescriptionColIndex = -1;
          let locationColIndex = -1;
          let assignmentColIndex = -1;
          
          headerRow.forEach((header, index) => {
            const headerLower = header.toLowerCase();
            if (headerLower.includes('issue description') || headerLower.includes('description') || headerLower.includes('defect')) {
              issueDescriptionColIndex = index;
              console.log(`Found Issue Description column at index ${index}`);
            }
            if (headerLower.includes('location') || headerLower.includes('position') || headerLower.includes('area')) {
              locationColIndex = index;
              console.log(`Found Location column at index ${index}`);
            }
            if (headerLower.includes('assignment') || headerLower.includes('department') || headerLower.includes('assigned to') || headerLower.includes('responsible')) {
              assignmentColIndex = index;
              console.log(`Found Assignment/Department column at index ${index}`);
            }
          });
          
          // If we found at least the issue description column, extract structured data
          if (issueDescriptionColIndex !== -1) {
            console.log('Found issue description column - extracting structured quality issues');
            
            // Get all row indices after the header row (rowIndex > 0)
            const rowIndexSet = new Set(tableCells
              .filter(cell => cell.rowIndex > 0)
              .map(cell => cell.rowIndex));
              
            // Convert Set to Array for iteration
            const rowIndices = Array.from(rowIndexSet);
            
            // For each row, extract issue description, location, and assignment
            for (const rowIndex of rowIndices) {
              // Find cells for this row
              const issueDescriptionCell = tableCells.find(
                cell => cell.rowIndex === rowIndex && cell.columnIndex === issueDescriptionColIndex
              );
              
              // Skip empty rows or rows without issue description
              if (!issueDescriptionCell || !issueDescriptionCell.text.trim()) {
                continue;
              }
              
              const locationCell = locationColIndex !== -1 ? 
                tableCells.find(cell => cell.rowIndex === rowIndex && cell.columnIndex === locationColIndex) : null;
                
              const assignmentCell = assignmentColIndex !== -1 ? 
                tableCells.find(cell => cell.rowIndex === rowIndex && cell.columnIndex === assignmentColIndex) : null;
              
              // Extract text values
              const issueText = issueDescriptionCell.text.trim();
              const locationText = locationCell ? locationCell.text.trim() : '';
              const assignmentText = assignmentCell ? assignmentCell.text.trim() : '';
              
              console.log(`Row ${rowIndex} - Issue: "${issueText}", Location: "${locationText}", Assignment: "${assignmentText}"`);
              
              // Use the assignment text as the department if available
              const department = assignmentText || await this.determineDepartment(issueText, inspectionType);
              
              // Determine severity based on the issue text
              const severity = await this.determineSeverity(issueText);
              
              // Determine category based on the issue text
              const category = await this.categorizeIssue(issueText);
              
              // Create a structured OCR result for this issue
              const issueResult: OCRResult = {
                text: issueText,
                confidence: issueDescriptionCell.confidence,
                boundingBox: [], // We don't have the polygon coordinates here
                category,
                severity,
                department,
                location: locationText, // Add location as a new field
                isStructuredTableRow: true, // Mark this as a structured table row
                tableCells: [
                  {
                    rowIndex,
                    columnIndex: issueDescriptionColIndex,
                    text: issueText,
                    confidence: issueDescriptionCell.confidence
                  },
                  ...(locationCell ? [{
                    rowIndex,
                    columnIndex: locationColIndex,
                    text: locationText,
                    confidence: locationCell.confidence
                  }] : []),
                  ...(assignmentCell ? [{
                    rowIndex,
                    columnIndex: assignmentColIndex,
                    text: assignmentText,
                    confidence: assignmentCell.confidence
                  }] : [])
                ]
              };
              
              ocrResults.push(issueResult);
              
              // Update analytics
              analytics.issueTypes[category] = (analytics.issueTypes[category] || 0) + 1;
              analytics.severityDistribution[severity] = (analytics.severityDistribution[severity] || 0) + 1;
              analytics.confidence += issueDescriptionCell.confidence;
            }
          } else {
            // If we couldn't find specific columns, fall back to the original approach
            console.log('Unable to find Issue Description column - falling back to generic table processing');
            
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

      // Ensure we have at least some results
      if (ocrResults.length === 0) {
        // Create a default result to indicate we received the document but couldn't extract text
        ocrResults.push({
          text: "No text content could be extracted from this document. Try a different format or check image quality.",
          confidence: 0.5,
          boundingBox: [],
          category: "Other",
          severity: "Minor",
          department: "Quality Control"
        });
        
        analytics.issueTypes["Other"] = 1;
        analytics.severityDistribution["Minor"] = 1;
        analytics.confidence = 0.5;
      }

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