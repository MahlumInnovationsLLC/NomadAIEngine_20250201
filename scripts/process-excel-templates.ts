import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { CosmosClient, Container } from '@azure/cosmos';

// Define the equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables for Cosmos DB connection
const COSMOS_ENDPOINT = process.env.AZURE_COSMOS_ENDPOINT || '';
const COSMOS_KEY = process.env.AZURE_COSMOS_KEY || '';
const DATABASE_ID = process.env.COSMOS_DATABASE_ID || 'nomad-manufacturing';
const CONTAINER_ID = 'inspection-templates';

interface TemplateField {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multi-select' | 'visual' | 'measurement' | 'image';
  label: string;
  description: string;
  required: boolean;
  options?: string[];
  acceptable?: string[];
  unit?: string;
  min?: number;
  max?: number;
  tolerance?: {
    value: number;
    type: 'absolute' | 'percentage';
  };
}

interface TemplateSection {
  id: string;
  title: string;
  description: string;
  order: number;
  fields: TemplateField[];
  displayCondition?: string;
}

interface InspectionTemplate {
  id: string;
  name: string;
  description: string;
  version: number;
  isActive: boolean;
  isArchived: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  sections: TemplateSection[];
  standard: string;
}

async function getTemplateContainer(): Promise<Container> {
  console.log('Connecting to Cosmos DB...');
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY,
  });
  
  const database = client.database(DATABASE_ID);
  const container = database.container(CONTAINER_ID);
  
  // Test the connection
  try {
    await container.items.readAll().fetchNext();
    console.log('Successfully connected to Cosmos DB container');
    return container;
  } catch (err) {
    console.error('Failed to connect to Cosmos DB:', err);
    throw err;
  }
}

function mapCellTypeToFieldType(value: any): TemplateField['type'] {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.toLowerCase().includes('date')) return 'date';
    if (value.toLowerCase().includes('measurement') || 
        value.toLowerCase().includes('dimension')) return 'measurement';
    if (value.toLowerCase().includes('visual') || 
        value.toLowerCase().includes('inspect')) return 'visual';
    if (value.toLowerCase().includes('select') || 
        value.toLowerCase().includes('choose')) return 'select';
    if (value.toLowerCase().includes('image') || 
        value.toLowerCase().includes('photo')) return 'image';
  }
  return 'text'; // Default type
}

function processExcelSheet(worksheet: XLSX.WorkSheet, sheetName: string): InspectionTemplate | null {
  console.log(`Processing sheet: ${sheetName}`);
  
  // Convert sheet to JSON with header rows intact
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
  
  if (data.length === 0) {
    console.warn(`Sheet ${sheetName} is empty`);
    return null;
  }

  // Look for project information in the first few rows
  let projectNumber = '';
  let projectName = '';
  
  // Try to find project number and name in first 5 rows
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (Array.isArray(row) && row.length > 1) {
      if (typeof row[0] === 'string' && row[0].includes('Project Number')) {
        projectNumber = String(row[1] || '').replace('[PROJECT #]', '');
      }
      if (typeof row[0] === 'string' && row[0].includes('Project Name')) {
        projectName = String(row[1] || '').replace('[PROJECT NAME]', '');
      }
    }
  }
  
  // Convert to row objects format for easier processing
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
  
  if (jsonData.length === 0) {
    console.warn(`Sheet ${sheetName} could not be processed into JSON records`);
    return null;
  }
  
  // Create template
  const template: InspectionTemplate = {
    id: uuidv4(),
    name: sheetName, // Use sheet name as template name
    description: `Inspection template for ${projectName || sheetName}`,
    version: 1,
    isActive: true,
    isArchived: false,
    category: 'manufacturing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [],
    standard: 'ISO 9001'
  };
  
  // Determine columns
  const firstRow = jsonData[0] as Record<string, unknown>;
  const columns = Object.keys(firstRow);
  
  console.log('Column headers:', columns);
  
  // Special handling for MFG_and_INSP_Traveler formats
  // These have specific sections with structured data
  const isMfgTravelerSheet = sheetName.includes('IP Inspection') || 
                             sheetName.includes('Equip ID') || 
                             sheetName.includes('Road Test') ||
                             sheetName.includes('Water Test') ||
                             sheetName.includes('Operational') ||
                             sheetName.includes('Quantitative') ||
                             sheetName.includes('Final QC');
  
  // Process rows to determine sections and fields
  let currentSection: TemplateSection | null = null;
  let sectionOrder = 0;
  
  // First, try to identify section headers
  const sectionHeaderRows = (data as unknown[]).filter((row) => {
    if (typeof row !== 'object' || row === null) return false;
    const typedRow = row as Record<string, unknown>;
    // Look for rows that might be section headers
    const values = Object.values(typedRow);
    // Check if row has few values and some cells are empty
    const filledCells = values.filter(v => v !== undefined && v !== null && v !== '').length;
    return filledCells <= 3 && filledCells > 0 && typeof values[0] === 'string';
  });
  
  console.log(`Identified ${sectionHeaderRows.length} potential section headers`);
  
  // If we can't clearly identify sections, create a single section
  if (sectionHeaderRows.length <= 1) {
    currentSection = {
      id: uuidv4(),
      title: sheetName,
      description: `Inspection items for ${sheetName}`,
      order: 0,
      fields: []
    };
    
    template.sections.push(currentSection);
    
    // Create fields from each column
    columns.forEach((column, idx) => {
      // Skip empty or unnamed columns
      if (!column || column === '' || column.toString().trim() === '') return;
      
      // Make sure currentSection exists
      if (!currentSection) return;
      
      // First, check the type of first value in this column
      let firstValue: unknown = undefined;
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const firstRow = jsonData[0] as Record<string, unknown>;
        firstValue = firstRow[column];
      }
      
      const field: TemplateField = {
        id: uuidv4(),
        type: mapCellTypeToFieldType(firstValue),
        label: column.toString(),
        description: `Field for ${column}`,
        required: idx < 3, // Make first few fields required
      };
      
      // Add appropriate field-specific properties
      if (field.type === 'measurement') {
        field.unit = 'mm'; // Default unit
      }
      
      if (field.type === 'visual') {
        field.acceptable = ['Acceptable', 'Not Acceptable'];
      }
      
      if (field.type === 'select') {
        // Try to extract unique values from the column
        const uniqueValues = new Set<string>();
        jsonData.forEach((row: Record<string, unknown>) => {
          const value = row[column];
          if (value && typeof value === 'string') {
            uniqueValues.add(value.trim());
          }
        });
        field.options = Array.from(uniqueValues).filter(v => v !== '');
        if (field.options.length === 0) {
          field.options = ['Option 1', 'Option 2', 'Option 3'];
        }
      }
      
      currentSection.fields.push(field);
    });
  } else {
    // Process by sections
    let currentSectionIdx = -1;
    
    data.forEach((row, rowIdx) => {
      const rowValues = Object.values(row);
      const filledCells = rowValues.filter(v => v !== undefined && v !== null && v !== '').length;
      
      // Check if this is a section header row
      if (filledCells <= 3 && filledCells > 0 && typeof rowValues[0] === 'string') {
        const sectionTitle = rowValues[0].toString().trim();
        if (sectionTitle) {
          currentSectionIdx++;
          sectionOrder++;
          
          currentSection = {
            id: uuidv4(),
            title: sectionTitle,
            description: `Inspection items for ${sectionTitle}`,
            order: sectionOrder,
            fields: []
          };
          
          template.sections.push(currentSection);
        }
      } else if (currentSection && filledCells > 1) {
        // This is a data row, create fields
        columns.forEach(column => {
          // Skip empty or unnamed columns
          if (!column || column === '' || column.toString().trim() === '') return;
          
          // Make sure currentSection still exists (TypeScript check)
          if (!currentSection) return;
          
          // Check if we already have this field in the section
          const existingField = currentSection.fields.find(f => f.label === column.toString());
          if (!existingField) {
            // Extract this row's data - need to be careful with types
            let cellValue: unknown = undefined;
            if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
                const typedRow = row as Record<string, unknown>;
                cellValue = typedRow[column];
            }
            
            const field: TemplateField = {
              id: uuidv4(),
              type: mapCellTypeToFieldType(cellValue),
              label: column.toString(),
              description: `Field for ${column}`,
              required: false,
            };
            
            // Add appropriate field-specific properties
            if (field.type === 'measurement') {
              field.unit = 'mm'; // Default unit
            }
            
            if (field.type === 'visual') {
              field.acceptable = ['Acceptable', 'Not Acceptable'];
            }
            
            if (field.type === 'select') {
              // Try to extract unique values from the column
              const uniqueValues = new Set<string>();
              jsonData.forEach((dataRow: Record<string, unknown>) => {
                const value = dataRow[column];
                if (value && typeof value === 'string') {
                  uniqueValues.add(value.trim());
                }
              });
              field.options = Array.from(uniqueValues).filter(v => v !== '');
              if (field.options.length === 0) {
                field.options = ['Option 1', 'Option 2', 'Option 3'];
              }
            }
            
            currentSection.fields.push(field);
          }
        });
      }
    });
  }
  
  // Ensure we have at least one section
  if (template.sections.length === 0) {
    template.sections.push({
      id: uuidv4(),
      title: sheetName,
      description: `Inspection items for ${sheetName}`,
      order: 0,
      fields: []
    });
  }
  
  console.log(`Created template with ${template.sections.length} sections and ${template.sections.reduce((sum, section) => sum + section.fields.length, 0)} total fields`);
  
  return template;
}

async function processExcelFile(filePath: string): Promise<InspectionTemplate[]> {
  console.log(`Reading Excel file: ${filePath}`);
  
  try {
    // Read the file as a binary buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Load the workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    console.log(`Excel file loaded with ${workbook.SheetNames.length} sheets`);
    console.log('Sheet names:', workbook.SheetNames);
    
    // Process each sheet
    const templates: InspectionTemplate[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const template = processExcelSheet(worksheet, sheetName);
      if (template) {
        templates.push(template);
      }
    }
    
    return templates;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
}

async function saveTemplates(templates: InspectionTemplate[]): Promise<void> {
  try {
    const container = await getTemplateContainer();
    
    console.log(`Saving ${templates.length} templates to Cosmos DB...`);
    
    for (const template of templates) {
      console.log(`Saving template: ${template.name}`);
      try {
        const response = await container.items.create(template);
        if (response.resource) {
          console.log(`Successfully saved template: ${response.resource.id}`);
        } else {
          console.log(`Template saved but no resource returned`);
        }
      } catch (err) {
        console.error(`Failed to save template ${template.name}:`, err);
      }
    }
    
    console.log('All templates saved successfully');
  } catch (error) {
    console.error('Error saving templates:', error);
    throw error;
  }
}

async function main() {
  try {
    const filePath = path.resolve(__dirname, '../attached_assets/MFG_and_INSP_Traveler_v24.05.23.xlsx');
    console.log(`Processing file at path: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    
    const templates = await processExcelFile(filePath);
    console.log(`Processed ${templates.length} templates from Excel file`);
    
    // Optionally save to a JSON file for review
    const outputDir = path.resolve(__dirname, '../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(outputDir, 'processed_templates.json'), 
      JSON.stringify(templates, null, 2)
    );
    console.log(`Templates saved to: ${path.join(outputDir, 'processed_templates.json')}`);
    
    // Save to database
    await saveTemplates(templates);
    
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

main();