import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file
const excelFilePath = path.join(__dirname, "../attached_assets/MFG_and_INSP_Traveler_v24.05.23.xlsx");

// Read the Excel file
try {
  const workbook = XLSX.readFile(excelFilePath);
  
  // Get sheet names
  const sheetNames = workbook.SheetNames;
  console.log("Sheet Names:", sheetNames);
  
  // Get the first few rows from each sheet to understand structure
  sheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    
    // Print the first 3 rows or fewer if sheet has fewer rows
    const rowsToPrint = Math.min(3, jsonData.length);
    for (let i = 0; i < rowsToPrint; i++) {
      console.log(`Row ${i + 1}:`, jsonData[i]);
    }
  });
} catch (error) {
  console.error("Error reading Excel file:", error);
}
