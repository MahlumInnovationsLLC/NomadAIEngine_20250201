import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file
const filePath = path.resolve(__dirname, '../attached_assets/MFG_and_INSP_Traveler_v24.05.23.xlsx');

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the Excel file
try {
  const workbook = xlsx.readFile(filePath);
  
  console.log('Excel file information:');
  console.log('----------------------');
  console.log(`Number of sheets: ${workbook.SheetNames.length}`);
  console.log('Sheet names:');
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`${index + 1}. ${sheetName}`);
  });
  
  // Analyze first row of each sheet to understand the structure
  console.log('\nSheet Structure Analysis:');
  console.log('----------------------');
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`\nSheet: ${sheetName}`);
    
    if (jsonData.length > 0) {
      const headerRow = jsonData[0];
      console.log(`Number of columns: ${headerRow.length}`);
      console.log('First row content:');
      console.log(headerRow);
      
      // Count number of rows
      console.log(`Number of rows: ${jsonData.length}`);
      
      // Sample a few rows to understand the data type
      if (jsonData.length > 1) {
        console.log('Sample data row:');
        console.log(jsonData[1]);
      }
    } else {
      console.log('Sheet appears to be empty');
    }
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error);
  process.exit(1);
}