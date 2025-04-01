import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";

/**
 * OCRResult - Represents an item extracted from OCR processing
 * For QC Punchlist, we specifically focus on extracting:
 * - Issue Description (text)
 * - Location
 * - Assignment/Department (department)
 */
interface OCRResult {
  // Core fields (always present)
  text: string;               // The issue description text
  confidence: number;         // Confidence level of extraction
  boundingBox: number[];      // For visualization (may be empty)
  
  // Structural information about the extraction
  isStructuredTableRow?: boolean;   // True for rows extracted from structured tables
  isTable?: boolean;                // True for generic table data (not used in structured extraction)
  
  // Key fields from QC Punchlist
  location?: string;        // The location field from the table
  department?: string;      // The assignment/department field from the table
  
  // Additional metadata (derived or inferred)
  category?: string;        // Category of issue (derived from text analysis)
  severity?: string;        // Severity level (derived from text analysis)
  
  // Raw table cell data if available
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
    const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || "";
                     
    const key = process.env.AZURE_FORM_RECOGNIZER_KEY || "";

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
      console.log('FOCUS: Extracting ONLY "Issue Description", "Location", and "Assignment" columns');
      
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
        // For QC Punchlist documents, we specifically want to use the layout model
        // which is better at detecting tables with headers and columns
        const modelId = "prebuilt-layout";
        console.log(`Using model ${modelId} for QC Punchlist analysis`);
        
        const formPoller = await this.documentClient.beginAnalyzeDocument(
          modelId,
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
        // For QC Punchlist documents, we specifically want to use the document model
        // which is better at extracting structured content
        const modelId = isPdf ? "prebuilt-document" : "prebuilt-read";
        console.log(`Using model ${modelId} for text extraction based on file type`);
        
        const textPoller = await this.documentClient.beginAnalyzeDocument(
          modelId,
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

      // Results will only include structured row data from the three target columns
      const ocrResults: OCRResult[] = [];
      const analytics = {
        issueTypes: {} as { [key: string]: number },
        severityDistribution: {} as { [key: string]: number },
        confidence: 0,
      };
      
      // Process tables first (from layout analysis)
      // STRICTLY FOCUS ON: "Issue Description", "Location", and "Assignment" columns only
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
          
          // Determine the header row to use for column identification
          const headerRowCells = table.cells.filter(cell => cell.rowIndex === 0);
          const headerRow = headerRowCells.map(cell => cell.content);
            
          console.log('Table headers:', headerRow);
          
          // Extract only relevant cells (don't store ALL cells)
          // First identify the target column indices
          let issueDescriptionColIndex = -1;
          let locationColIndex = -1;
          let assignmentColIndex = -1;
          
          // Get exact column indices for our three target columns
          headerRowCells.forEach(cell => {
            const headerLower = cell.content.toLowerCase().trim();
            
            // Check for exact column header matches first
            if (headerLower === 'issue description') {
              issueDescriptionColIndex = cell.columnIndex;
              console.log(`Found exact match for Issue Description column at index ${cell.columnIndex}`);
            } 
            else if (headerLower.includes('issue description')) {
              issueDescriptionColIndex = cell.columnIndex;
              console.log(`Found fuzzy match for Issue Description column at index ${cell.columnIndex}`);
            }
            
            if (headerLower === 'location') {
              locationColIndex = cell.columnIndex;
              console.log(`Found exact match for Location column at index ${cell.columnIndex}`);
            }
            else if (headerLower.includes('location')) {
              locationColIndex = cell.columnIndex;
              console.log(`Found fuzzy match for Location column at index ${cell.columnIndex}`);
            }
            
            if (headerLower === 'assignment') {
              assignmentColIndex = cell.columnIndex;
              console.log(`Found exact match for Assignment column at index ${cell.columnIndex}`);
            }
            else if (headerLower.includes('assignment')) {
              assignmentColIndex = cell.columnIndex;
              console.log(`Found fuzzy match for Assignment column at index ${cell.columnIndex}`);
            }
          });
          
          // Only collect cells from the three columns we care about
          console.log(`Target columns - Issue: ${issueDescriptionColIndex}, Location: ${locationColIndex}, Assignment: ${assignmentColIndex}`);
          
          // Only collect cells from the identified target columns
          for (const cell of table.cells) {
            if (
              cell.rowIndex > 0 && // Skip header row
              (
                cell.columnIndex === issueDescriptionColIndex || 
                cell.columnIndex === locationColIndex || 
                cell.columnIndex === assignmentColIndex
              )
            ) {
              tableCells.push({
                rowIndex: cell.rowIndex,
                columnIndex: cell.columnIndex,
                text: cell.content.trim(),
                confidence: 0.95 // High confidence for table structure
              });
            }
          }
          
          // If we found at least the issue description column, extract structured data
          if (issueDescriptionColIndex !== -1) {
            console.log('Found issue description column - extracting only relevant structured quality issues');
            
            // Get all row indices after the header row (rowIndex > 0)
            const rowIndexSet = new Set(tableCells
              .filter(cell => cell.rowIndex > 0)
              .map(cell => cell.rowIndex));
              
            // Convert Set to Array for iteration
            const rowIndices = Array.from(rowIndexSet).sort((a, b) => a - b);
            console.log(`Processing ${rowIndices.length} data rows from the table`);
            
            // For each row, extract ONLY issue description, location, and assignment
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
              
              // Extract text values (only from the three columns we care about)
              const issueText = issueDescriptionCell.text.trim();
              const locationText = locationCell ? locationCell.text.trim() : '';
              const assignmentText = assignmentCell ? assignmentCell.text.trim() : '';
              
              // Skip rows that don't have meaningful content
              if (!issueText || issueText === '') {
                console.log(`Skipping row ${rowIndex} due to empty issue description`);
                continue;
              }
              
              console.log(`Row ${rowIndex} - Issue: "${issueText}", Location: "${locationText}", Assignment: "${assignmentText}"`);
              
              // Use the assignment text as the department
              const department = assignmentText;
              
              // Determine severity based on the issue text
              const severity = await this.determineSeverity(issueText);
              
              // Create a structured OCR result for this issue
              // Only include the three fields we care about
              const issueResult: OCRResult = {
                text: issueText,
                confidence: issueDescriptionCell.confidence,
                boundingBox: [],
                severity,
                department,
                location: locationText,
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
              const category = await this.categorizeIssue(issueText);
              analytics.issueTypes[category] = (analytics.issueTypes[category] || 0) + 1;
              analytics.severityDistribution[severity] = (analytics.severityDistribution[severity] || 0) + 1;
              analytics.confidence += issueDescriptionCell.confidence;
            }
            
            console.log(`Successfully extracted ${ocrResults.length} structured issues from the table`);
          } else {
            // Log that we couldn't find the required columns
            console.log('CRITICAL: Could not find Issue Description column - this document may not have the expected format');
            console.log('WARNING: Not adding generic table data since we only want data from the three target columns');
          }
        }
      }

      // DO NOT process regular text from document analysis - we only want the structured data
      // from the three specific columns (Issue Description, Location, Assignment)
      console.log('Skipping processing of regular text content - focusing ONLY on structured table data');
      
      // Nothing to do here - we've already extracted the structured data from tables
      // with the specific columns we need

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