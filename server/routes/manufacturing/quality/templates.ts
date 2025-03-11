import express, { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../../../auth-middleware';
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getInspectionTemplatesContainer } from '../../../services/azure/cosmos_service';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const CONTAINER_ID = 'inspection-templates';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../../uploads");
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only Excel files are allowed"));
  }
});

// Map Excel column data type to template field type
function mapCellTypeToFieldType(value: unknown): "text" | "number" | "boolean" | "date" | "select" | "visual" | "measurement" {
  if (value === undefined || value === null) {
    return "text";
  }
  
  if (typeof value === "number") {
    return "measurement";
  }
  
  if (typeof value === "boolean") {
    return "boolean";
  }
  
  if (value instanceof Date) {
    return "date";
  }
  
  // Check if it's a string that might represent a select or visual field
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    
    // Check for values that suggest visual inspection
    if (lowerValue.includes("inspect") || 
        lowerValue.includes("visual") || 
        lowerValue.includes("check") ||
        lowerValue.includes("verify") ||
        lowerValue === "pass" ||
        lowerValue === "fail" ||
        lowerValue === "acceptable" ||
        lowerValue === "not acceptable") {
      return "visual";
    }
    
    // Check for dropdown-like values
    if (lowerValue.includes("select") || 
        lowerValue.includes("option") ||
        lowerValue.includes("choose") ||
        lowerValue.includes("dropdown")) {
      return "select";
    }
  }
  
  // Default to text for everything else
  return "text";
}

// Process Excel file and convert to template format
async function processExcelTemplates(filePath: string) {
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const templates = [];
    
    // Process each sheet as a separate template
    for (const sheetName of workbook.SheetNames) {
      console.log(`Processing sheet: ${sheetName}`);
      
      // Skip template if it's a utility or reference sheet
      if (sheetName === 'Key List') {
        console.log(`Skipping utility sheet: ${sheetName}`);
        continue;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // First convert sheet to array with header rows intact
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      
      if (rawData.length === 0) {
        console.log(`Skipping empty sheet: ${sheetName}`);
        continue;
      }
      
      // Look for project information in the first few rows
      let projectNumber = '';
      let projectName = '';
      let templateTitle = '';
      
      // Extract project details from header
      for (let i = 0; i < Math.min(3, rawData.length); i++) {
        const row = rawData[i];
        if (Array.isArray(row) && row.length > 1) {
          if (typeof row[0] === 'string' && row[0].includes('Project Number')) {
            projectNumber = String(row[1] || '');
          }
          if (typeof row[0] === 'string' && row[0].includes('Project Name')) {
            projectName = String(row[1] || '');
          }
          // Get main title (typically in row 0 or 1, column 3 or 4)
          if (row.length > 3 && typeof row[3] === 'string' && row[3].trim() !== '') {
            templateTitle = row[3].toString().trim();
          }
        }
      }
      
      if (!templateTitle) {
        templateTitle = sheetName;
      }
      
      // Create template structure
      const template = {
        id: uuidv4(),
        name: templateTitle,
        description: `Inspection template for ${sheetName}`,
        type: 'inspection-template',
        version: 1,
        isActive: true,
        isArchived: false,
        category: determineCategory(sheetName),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [] as any[],
        standard: "ISO 9001:2015",
        metadata: {
          sourceSheet: sheetName,
          projectNumberPlaceholder: projectNumber,
          projectNamePlaceholder: projectName
        }
      };
      
      // Find the row that contains column headers (usually contains "FAIL", "PASS", etc.)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (Array.isArray(row) && row.some(cell => 
          typeof cell === 'string' && 
          (cell.includes('FAIL') || cell.includes('PASS'))
        )) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        console.log(`Could not find header row in sheet: ${sheetName}, using default headers`);
        headerRowIndex = 2; // Default to row 3 (index 2)
      }
      
      // Extract column headers
      const headers = rawData[headerRowIndex].map(h => h?.toString().trim() || '');
      console.log(`Headers for ${sheetName}:`, headers);
      
      // Initialize sections
      let currentSectionTitle = "General Inspection";
      let currentSectionDescription = `Main inspection items for ${templateTitle}`;
      let sectionOrder = 0;
      let currentSection = {
        id: uuidv4(),
        title: currentSectionTitle,
        description: currentSectionDescription,
        order: sectionOrder,
        fields: [] as any[]
      };
      
      // Process actual inspection items, starting after the header row
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        if (!Array.isArray(row) || row.length === 0 || !row[0]) {
          continue; // Skip empty rows
        }
        
        const firstCell = row[0]?.toString().trim();
        
        // Check if it's potentially a section header (shorter text, possibly in all caps or bold)
        if (firstCell && 
            !row[1] && // Usually section headers only have content in first column
            (firstCell.toUpperCase() === firstCell || // All caps
             firstCell.length < 40) && // Short text
            i < rawData.length - 1) { // Not the last row
            
          // This is likely a section header
          if (currentSection.fields.length > 0) {
            // Add the completed section before starting a new one
            template.sections.push(currentSection);
          }
          
          // Start a new section
          sectionOrder++;
          currentSectionTitle = firstCell;
          currentSectionDescription = `Inspection items for ${firstCell}`;
          
          currentSection = {
            id: uuidv4(),
            title: currentSectionTitle,
            description: currentSectionDescription,
            order: sectionOrder,
            fields: [] as any[]
          };
          
          continue; // Skip to next row after creating a new section
        }
        
        // Process inspection item - the first column is always the inspection description
        if (firstCell && firstCell.length > 3) { // Valid inspection item
          // Create a field for this inspection item
          const inspectionField = {
            id: uuidv4(),
            type: "visual", // Most inspection items are visual pass/fail
            label: firstCell,
            description: firstCell,
            required: true,
            acceptable: ["PASS", "FAIL"]
          };
          
          // Special handling for specific inspection types
          if (sheetName.includes('Paint') && headers.some(h => h.includes('THICKNESS'))) {
            // Add a measurement field for paint thickness
            const measurementField = {
              id: uuidv4(),
              type: "measurement",
              label: `${firstCell} - Thickness`,
              description: `Measurement for ${firstCell}`,
              required: true,
              unit: "mils", // Paint thickness is typically measured in mils
              min: 0,
              max: 100,
              nominalValue: 20 // Default nominal value
            };
            
            currentSection.fields.push(measurementField);
          }
          
          // Add a comments field for each inspection item
          const commentsField = {
            id: uuidv4(),
            type: "text",
            label: `${firstCell} - Comments`,
            description: `Comments for ${firstCell}`,
            required: false
          };
          
          currentSection.fields.push(inspectionField);
          currentSection.fields.push(commentsField);
        }
      }
      
      // Add the last section if it has fields
      if (currentSection.fields.length > 0) {
        template.sections.push(currentSection);
      }
      
      // If no sections were created, add a default one
      if (template.sections.length === 0) {
        template.sections.push({
          id: uuidv4(),
          title: "General Inspection",
          description: `Inspection items for ${templateTitle}`,
          order: 0,
          fields: []
        });
      }
      
      templates.push(template);
      console.log(`Created template "${templateTitle}" with ${template.sections.length} sections and ${template.sections.reduce((sum, section) => sum + section.fields.length, 0)} fields`);
    }
    
    return templates;
  } catch (error) {
    console.error("Error processing Excel file:", error);
    throw new Error("Failed to process Excel file");
  }
}

// Determine category based on sheet name
function determineCategory(sheetName: string): string {
  const name = sheetName.toLowerCase();
  
  if (name.includes("ip") || name.includes("in-process") || name.includes("process")) {
    return "in-process";
  }
  
  if (name.includes("fab") || name.includes("fabrication")) {
    return "fabrication";
  }
  
  if (name.includes("assembly")) {
    return "assembly";
  }
  
  if (name.includes("paint") || name.includes("coating")) {
    return "painting";
  }
  
  if (name.includes("final") || name.includes("finished")) {
    return "final-inspection";
  }
  
  if (name.includes("equipment") || name.includes("machine")) {
    return "equipment";
  }
  
  if (name.includes("test") || name.includes("testing")) {
    return "testing";
  }
  
  if (name.includes("receive") || name.includes("receiving") || name.includes("receipt")) {
    return "receiving";
  }
  
  if (name.includes("calibration") || name.includes("calibrate")) {
    return "calibration";
  }
  
  return "general"; // Default category
}

// Ensure that the container exists and use our centralized helper
async function getTemplatesContainer(): Promise<Container | null> {
  console.log(`Attempting to get templates container using helper function`);
  try {
    const container = getInspectionTemplatesContainer();
    if (!container) {
      console.error(`Container ${CONTAINER_ID} not found. Database initialization may be incomplete.`);
      return null;
    }
    console.log(`Successfully accessed container: ${CONTAINER_ID}`);
    return container;
  } catch (error) {
    console.error(`Error accessing container ${CONTAINER_ID}:`, error);
    return null;
  }
}

export function registerTemplateRoutes(app: express.Application) {
  // Get all templates
  app.get('/api/manufacturing/quality/templates', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      // Define the query to retrieve all templates
      const querySpec: SqlQuerySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [
          {
            name: '@type',
            value: 'inspection-template'
          }
        ]
      };

      // Execute the query
      const { resources: templates } = await container.items.query(querySpec).fetchAll();

      // Sort templates by name
      templates.sort((a, b) => a.name.localeCompare(b.name));

      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Download blank template for users to fill out and import
  // This route must come before the /:id route to avoid being treated as a parameter
  app.get('/api/manufacturing/quality/templates/blank', async (req: Request, res: Response) => {
    try {
      console.log('Generating blank template...');
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create template structure for different inspection types
      const inspectionTypes = [
        {
          name: "Sample FAB Inspection",
          headers: [
            "Project Number:",
            "Project Name:",
            "",
            "FAB Inspection Items",
            "FAIL\n(Initial/Date)",
            "Rework\n(Initial/Date)",
            "Comments\n(required if FAIL)",
            "PASS\n(Initial/Date)",
            "Final Comments\n(as needed)"
          ],
          sampleItems: [
            "Subframe welds acceptable",
            "Floor welds acceptable",
            "Wall attachment points secure",
            "Ceiling structure complete",
            "Door frames installed correctly"
          ]
        },
        {
          name: "Sample Paint Inspection",
          headers: [
            "Project Number:",
            "Project Name:",
            "", 
            "Paint Inspection Items",
            "FAIL\n(Initial/Date)",
            "Fixed\n(Initial/Date)",
            "PASS\n(Initial/Date)",
            "THICKNESS (mils)",
            "Comments"
          ],
          sampleItems: [
            "Surface preparation complete",
            "Primer application uniform",
            "Paint color matches specification",
            "No visible runs or sags",
            "Edge coverage complete"
          ]
        },
        {
          name: "Sample Final Inspection",
          headers: [
            "Project Number:",
            "Project Name:",
            "",
            "Final Quality Check",
            "FAIL\n(Initial/Date)",
            "Fixed\n(Initial/Date)",
            "Comments\n(required if FAIL)",
            "PASS\n(Initial/Date)",
            "Final Comments\n(as needed)"
          ],
          sampleItems: [
            "All systems operational",
            "Exterior finish meets standards",
            "Interior components secured",
            "Documentation complete",
            "Client specifications met"
          ]
        }
      ];
      
      // Create worksheets for each inspection type
      inspectionTypes.forEach(template => {
        // Create worksheet data starting with instructions
        const wsData = [
          ["NOMAD QUALITY MANAGEMENT SYSTEM - TEMPLATE EXAMPLE"],
          ["Instructions: Fill out this template with your inspection items then import it into the QMS system"],
          ["1. Keep the header structure intact (first 3-4 rows)"],
          ["2. Replace sample inspection items with your own"],
          ["3. You can create multiple sections by leaving a blank row and adding a section title"],
          ["4. Save as Excel (.xlsx) file and import using the QMS Import function"],
          [""],
          [template.headers[0], "[Your Project #]"],
          [template.headers[1], "[Your Project Name]"],
          [""],
          template.headers,
          [""]
        ];
        
        // Add sample inspection items
        template.sampleItems.forEach(item => {
          const row = [item, "", "", "", "", ""];
          // Ensure row matches header length
          while (row.length < template.headers.length) {
            row.push("");
          }
          wsData.push(row);
        });
        
        // Add a sample section break
        wsData.push([""]);
        wsData.push(["SAMPLE SECTION HEADER"]);
        wsData.push([""]);
        
        // Add a few more sample items
        for (let i = 1; i <= 3; i++) {
          const row = [`Example item ${i} - replace with your content`, "", "", "", "", ""];
          while (row.length < template.headers.length) {
            row.push("");
          }
          wsData.push(row);
        }
        
        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        const colWidths = template.headers.map(h => ({ width: Math.max(15, h.length * 1.5) }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, template.name);
      });
      
      // Create a worksheet with instructions
      const instructionsData = [
        ["NOMAD QUALITY MANAGEMENT SYSTEM - TEMPLATE INSTRUCTIONS"],
        [""],
        ["This Excel file contains sample inspection templates that you can modify and import into the QMS system."],
        [""],
        ["How to use this template:"],
        ["1. Navigate to the different sheets to see examples for different inspection types (FAB, Paint, Final)"],
        ["2. Customize the sheets with your own inspection items and requirements"],
        ["3. Keep the header structure intact (Project Number, Project Name, column headers)"],
        ["4. Organization:"],
        ["   - Group related inspection items into sections"],
        ["   - Create a new section by adding a row with just the section name"],
        ["   - Each inspection item should be in its own row"],
        ["5. Save the file when complete"],
        ["6. Import the file using the QMS Template Import function"],
        [""],
        ["Template Structure:"],
        ["- First rows: Project information (number, name)"],
        ["- Headers row: Defines the columns (Pass/Fail, Comments, etc.)"],
        ["- Inspection items: Each row represents one item to inspect"],
        ["- Sections: Group related items together"],
        [""],
        ["For further assistance, contact the QMS Administrator."],
      ];
      
      const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
      XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="qms-inspection-template.xlsx"');
      res.setHeader('Content-Length', excelBuffer.length);
      
      // Send the file
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error generating blank template:', error);
      res.status(500).json({ 
        message: 'Failed to generate blank template', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get a specific template by ID
  app.get('/api/manufacturing/quality/templates/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;
      const { resource: template } = await container.item(id, id).read();

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error(`Error fetching template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create a new template
  app.post('/api/manufacturing/quality/templates', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const newTemplate = {
        ...req.body,
        id: uuidv4(),
        type: 'inspection-template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user?.id || 'unknown',
      };

      // Validate the template
      if (!newTemplate.name || !newTemplate.category) {
        return res.status(400).json({ message: 'Name and category are required' });
      }

      // Create the template in the database
      const { resource: createdTemplate } = await container.items.create(newTemplate);

      res.status(201).json(createdTemplate);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Failed to create template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update an existing template
  app.put('/api/manufacturing/quality/templates/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user?.id || 'unknown',
      };

      // Ensure ID remains the same
      if (updateData.id && updateData.id !== id) {
        return res.status(400).json({ message: 'Cannot change template ID' });
      }
      updateData.id = id;
      
      // Make sure type remains inspection-template
      updateData.type = 'inspection-template';

      // Preserve creation data
      try {
        const { resource: existingTemplate } = await container.item(id, id).read();
        if (existingTemplate) {
          updateData.createdAt = existingTemplate.createdAt;
          updateData.createdBy = existingTemplate.createdBy;
        }
      } catch (error) {
        console.warn(`Template with ID ${id} not found for update, will create new`);
      }

      // Update the template
      const { resource: updatedTemplate } = await container.items.upsert(updateData);

      res.json(updatedTemplate);
    } catch (error) {
      console.error(`Error updating template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to update template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete a template
  app.delete('/api/manufacturing/quality/templates/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;

      // Check if the template exists
      try {
        const { resource: template } = await container.item(id, id).read();
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
      } catch (error) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Delete the template
      await container.item(id, id).delete();

      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to delete template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get templates by category
  app.get('/api/manufacturing/quality/templates/category/:category', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { category } = req.params;

      // Define the query to retrieve templates by category
      const querySpec: SqlQuerySpec = {
        query: 'SELECT * FROM c WHERE c.type = @type AND c.category = @category',
        parameters: [
          {
            name: '@type',
            value: 'inspection-template'
          },
          {
            name: '@category',
            value: category
          }
        ]
      };

      // Execute the query
      const { resources: templates } = await container.items.query(querySpec).fetchAll();

      // Sort templates by name
      templates.sort((a, b) => a.name.localeCompare(b.name));

      res.json(templates);
    } catch (error) {
      console.error(`Error fetching templates for category ${req.params.category}:`, error);
      res.status(500).json({ message: 'Failed to fetch templates', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Duplicate a template
  app.post('/api/manufacturing/quality/templates/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;

      // Get the original template
      let originalTemplate;
      try {
        const { resource: template } = await container.item(id, id).read();
        originalTemplate = template;
      } catch (error) {
        return res.status(404).json({ message: 'Template not found' });
      }

      if (!originalTemplate) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Create a duplicate with a new ID
      const duplicateTemplate = {
        ...originalTemplate,
        id: uuidv4(),
        name: `${originalTemplate.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user?.id || 'unknown',
        // Reset version if it exists
        version: originalTemplate.version ? 1 : undefined,
      };

      // Create the duplicate in the database
      const { resource: createdTemplate } = await container.items.create(duplicateTemplate);

      res.status(201).json(createdTemplate);
    } catch (error) {
      console.error(`Error duplicating template with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to duplicate template', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Import templates from Excel file
  app.post('/api/manufacturing/quality/templates/import', 
    authMiddleware, 
    upload.single('file'), 
    async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const container = await getTemplatesContainer();
        if (!container) {
          return res.status(500).json({ message: 'Templates container not available' });
        }
        
        console.log(`Processing Excel file: ${req.file.path}`);
        
        // Process the Excel file
        const templates = await processExcelTemplates(req.file.path);
        console.log(`Processed ${templates.length} templates from Excel file`);
        
        // Save each template to Cosmos DB
        const savedTemplates = [];
        for (const template of templates) {
          try {
            console.log(`Saving template: ${template.name}`);
            const { resource } = await container.items.create(template);
            if (resource) {
              savedTemplates.push(resource);
              console.log(`Successfully saved template: ${resource.name}`);
            }
          } catch (err) {
            console.error('Error saving template:', err);
            // Continue with other templates even if one fails
          }
        }
        
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        
        res.status(201).json({ 
          message: 'Templates imported successfully',
          importedCount: savedTemplates.length,
          templates: savedTemplates.map(t => ({ id: t.id, name: t.name, category: t.category }))
        });
      } catch (error) {
        console.error('Error importing templates:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
          message: 'Failed to import templates', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );
  
  // Download blank template for users to fill out and import
  app.get('/api/manufacturing/quality/templates/blank', async (req: Request, res: Response) => {
    try {
      console.log('Generating blank template...');
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create template structure for different inspection types
      const inspectionTypes = [
        {
          name: "Sample FAB Inspection",
          headers: [
            "Project Number:",
            "Project Name:",
            "",
            "FAB Inspection Items",
            "FAIL\n(Initial/Date)",
            "Rework\n(Initial/Date)",
            "Comments\n(required if FAIL)",
            "PASS\n(Initial/Date)",
            "Final Comments\n(as needed)"
          ],
          sampleItems: [
            "Subframe welds acceptable",
            "Floor welds acceptable",
            "Wall attachment points secure",
            "Ceiling structure complete",
            "Door frames installed correctly"
          ]
        },
        {
          name: "Sample Paint Inspection",
          headers: [
            "Project Number:",
            "Project Name:",
            "", 
            "Paint Inspection Items",
            "FAIL\n(Initial/Date)",
            "Fixed\n(Initial/Date)",
            "PASS\n(Initial/Date)",
            "THICKNESS (mils)",
            "Comments"
          ],
          sampleItems: [
            "Surface preparation complete",
            "Primer application uniform",
            "Paint color matches specification",
            "No visible runs or sags",
            "Edge coverage complete"
          ]
        },
        {
          name: "Sample Final Inspection",
          headers: [
            "Project Number:",
            "Project Name:",
            "",
            "Final Quality Check",
            "FAIL\n(Initial/Date)",
            "Fixed\n(Initial/Date)",
            "Comments\n(required if FAIL)",
            "PASS\n(Initial/Date)",
            "Final Comments\n(as needed)"
          ],
          sampleItems: [
            "All systems operational",
            "Exterior finish meets standards",
            "Interior components secured",
            "Documentation complete",
            "Client specifications met"
          ]
        }
      ];
      
      // Create worksheets for each inspection type
      inspectionTypes.forEach(template => {
        // Create worksheet data starting with instructions
        const wsData = [
          ["NOMAD QUALITY MANAGEMENT SYSTEM - TEMPLATE EXAMPLE"],
          ["Instructions: Fill out this template with your inspection items then import it into the QMS system"],
          ["1. Keep the header structure intact (first 3-4 rows)"],
          ["2. Replace sample inspection items with your own"],
          ["3. You can create multiple sections by leaving a blank row and adding a section title"],
          ["4. Save as Excel (.xlsx) file and import using the QMS Import function"],
          [""],
          [template.headers[0], "[Your Project #]"],
          [template.headers[1], "[Your Project Name]"],
          [""],
          template.headers,
          [""]
        ];
        
        // Add sample inspection items
        template.sampleItems.forEach(item => {
          const row = [item, "", "", "", "", ""];
          // Ensure row matches header length
          while (row.length < template.headers.length) {
            row.push("");
          }
          wsData.push(row);
        });
        
        // Add a sample section break
        wsData.push([""]);
        wsData.push(["SAMPLE SECTION HEADER"]);
        wsData.push([""]);
        
        // Add a few more sample items
        for (let i = 1; i <= 3; i++) {
          const row = [`Example item ${i} - replace with your content`, "", "", "", "", ""];
          while (row.length < template.headers.length) {
            row.push("");
          }
          wsData.push(row);
        }
        
        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        const colWidths = template.headers.map(h => ({ width: Math.max(15, h.length * 1.5) }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, template.name);
      });
      
      // Create a worksheet with instructions
      const instructionsData = [
        ["NOMAD QUALITY MANAGEMENT SYSTEM - TEMPLATE INSTRUCTIONS"],
        [""],
        ["This Excel file contains sample inspection templates that you can modify and import into the QMS system."],
        [""],
        ["How to use this template:"],
        ["1. Navigate to the different sheets to see examples for different inspection types (FAB, Paint, Final)"],
        ["2. Customize the sheets with your own inspection items and requirements"],
        ["3. Keep the header structure intact (Project Number, Project Name, column headers)"],
        ["4. Organization:"],
        ["   - Group related inspection items into sections"],
        ["   - Create a new section by adding a row with just the section name"],
        ["   - Each inspection item should be in its own row"],
        ["5. Save the file when complete"],
        ["6. Import the file using the QMS Template Import function"],
        [""],
        ["Template Structure:"],
        ["- First rows: Project information (number, name)"],
        ["- Headers row: Defines the columns (Pass/Fail, Comments, etc.)"],
        ["- Inspection items: Each row represents one item to inspect"],
        ["- Sections: Group related items together"],
        [""],
        ["For further assistance, contact the QMS Administrator."],
      ];
      
      const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
      XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="qms-inspection-template.xlsx"');
      res.setHeader('Content-Length', excelBuffer.length);
      
      // Send the file
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error generating blank template:', error);
      res.status(500).json({ 
        message: 'Failed to generate blank template', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Download template as Excel
  app.get('/api/manufacturing/quality/templates/:id/download', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const container = await getTemplatesContainer();
      if (!container) {
        return res.status(500).json({ message: 'Templates container not available' });
      }

      const { id } = req.params;
      const { resource: template } = await container.item(id, id).read();
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Convert template to Excel format
      const workbook = XLSX.utils.book_new();
      
      // Create a worksheet for each section
      template.sections.forEach((section: any, index: number) => {
        const worksheetData = [{}]; // First row will be headers
        
        // Create headers from field labels
        const headers: Record<string, string> = {};
        section.fields.forEach((field: any) => {
          headers[field.label] = field.label;
        });
        
        worksheetData[0] = headers;
        
        // Create sample data row (optional)
        const sampleRow: Record<string, any> = {};
        section.fields.forEach((field: any) => {
          // Provide appropriate sample data based on field type
          if (field.type === 'text') {
            sampleRow[field.label] = '';
          } else if (field.type === 'number' || field.type === 'measurement') {
            sampleRow[field.label] = 0;
          } else if (field.type === 'boolean') {
            sampleRow[field.label] = false;
          } else if (field.type === 'date') {
            sampleRow[field.label] = new Date().toISOString().split('T')[0];
          } else if (field.type === 'select' && field.options?.length > 0) {
            sampleRow[field.label] = field.options[0];
          } else if (field.type === 'visual' && field.acceptable?.length > 0) {
            sampleRow[field.label] = field.acceptable[0];
          } else {
            sampleRow[field.label] = '';
          }
        });
        
        worksheetData.push(sampleRow);
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(worksheetData);
        
        // Add worksheet to workbook
        const sheetName = section.title.length > 31 ? section.title.substring(0, 31) : section.title;
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);  // Excel sheet names limited to 31 chars
      });
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name.replace(/[^a-z0-9]/gi, '_')}.xlsx"`);
      
      // Send Excel file
      res.status(200).send(excelBuffer);
    } catch (error) {
      console.error('Error downloading template:', error);
      res.status(500).json({ 
        message: 'Failed to download template', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}