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
  
  // Pick 3 representative sheets for detailed analysis
  const sheetsToAnalyze = [
    "IP Inspection FAB", 
    "IP Inspection Paint", 
    "Road Test"
  ];
  
  // Analyze selected sheets
  sheetsToAnalyze.forEach(sheetName => {
    console.log(`\n=== Detailed Analysis of Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    
    // Find the index where actual inspection items begin (usually after headers)
    let startRowIndex = 0;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row.some(cell => 
        typeof cell === "string" && 
        (cell.includes("FAIL") || cell.includes("PASS") || cell.includes("Inspection"))
      )) {
        startRowIndex = i + 1;
        break;
      }
    }
    
    console.log(`Inspection items start at row ${startRowIndex + 1}`);
    
    // Get column headers
    const headers = jsonData[startRowIndex - 1] || [];
    console.log("Headers:", headers);
    
    // Show a few inspection items
    console.log("Sample inspection items:");
    for (let i = startRowIndex; i < Math.min(startRowIndex + 5, jsonData.length); i++) {
      if (jsonData[i] && jsonData[i].length > 0 && jsonData[i][0] !== "") {
        console.log(`Item ${i - startRowIndex + 1}:`, jsonData[i]);
      }
    }
    
    // Count total items
    let itemCount = 0;
    for (let i = startRowIndex; i < jsonData.length; i++) {
      if (jsonData[i] && jsonData[i].length > 0 && jsonData[i][0] !== "") {
        itemCount++;
      }
    }
    console.log(`Total inspection items: ${itemCount}`);
  });
} catch (error) {
  console.error("Error reading Excel file:", error);
}
