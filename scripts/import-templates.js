/**
 * Template Import Utility
 * 
 * This script imports inspection templates from the MFG_and_INSP_Traveler Excel file
 * into the Nomad QMS system.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file
const excelFilePath = path.join(__dirname, "../attached_assets/MFG_and_INSP_Traveler_v24.05.23.xlsx");

async function importTemplates() {
  try {
    // Check if the file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error(`File not found: ${excelFilePath}`);
      process.exit(1);
    }
    
    console.log(`Importing templates from: ${excelFilePath}`);
    
    // Create form data with the Excel file
    const form = new FormData();
    form.append('file', fs.createReadStream(excelFilePath));

    // Send request to the import endpoint
    const response = await fetch('http://localhost:5000/api/manufacturing/quality/templates/import', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        // Add authorization if needed
        // 'Authorization': 'Bearer your-token-here'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to import templates: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Import successful: ${result.importedCount} templates imported`);
    console.log('Templates:');
    result.templates.forEach(template => {
      console.log(`- ${template.name} (${template.category})`);
    });
  } catch (error) {
    console.error('Error importing templates:', error);
    process.exit(1);
  }
}

// Run the import function
importTemplates();