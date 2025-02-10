import { Router } from "express";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = Router();
const containerName = "production-projects";

// Initialize Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || ""
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Ensure container exists
async function ensureContainer() {
  try {
    await containerClient.createIfNotExists();
  } catch (error) {
    console.error("Error creating container:", error);
  }
}

ensureContainer();

// Column mapping configuration
const columnMappings: { [key: string]: string[] } = {
  projectNumber: ['Project Number', 'ProjectNumber', '__EMPTY_2'],
  location: ['Location', '__EMPTY'],
  team: ['Team', '__EMPTY_1'],
  status: ['Tier IV Project Status', 'Status'],
  contractDate: ['Contract Date', 'ContractDate'],
  chassisEta: ['Chassis ETA', 'ChassisETA'],
  paymentMilestones: ['Payment Milestones', 'PaymentMilestones'],
  lltsOrdered: ['LLTs Ordered', 'LLTsOrdered'],
  meAssigned: ['ME Assigned', 'MEAssigned', '__EMPTY_8'],
  meCadProgress: ['ME CAD %', 'MECADProgress'],
  eeAssigned: ['EE Assigned', 'EEAssigned', '__EMPTY_10'],
  eeDesignProgress: ['EE Design / Orders %', 'EEDesignProgress'],
  itDesignProgress: ['IT Design / Orders %', 'ITDesignProgress'],
  ntcDesignProgress: ['NTC Design / Orders %', 'NTCDesignProgress'],
  ntcAssigned: ['NTC Assigned', 'NTCAssigned', '__EMPTY_12'],
  fabricationStart: ['Fabrication Start', '__EMPTY_14'],
  assemblyStart: ['Assembly Start', '__EMPTY_15'],
  wrapGraphics: ['Wrap Graphics', '__EMPTY_16'],
  ntcTesting: ['NTC Testing', '__EMPTY_17'],
  qcStart: ['QC Start', 'QC START', '__EMPTY_18'],
  executiveReview: ['Executive Review', 'EXECUTIVE REVIEW'],
  ship: ['Ship', '__EMPTY_21'],
  delivery: ['Delivery', '__EMPTY_22'],
  notes: ['Notes', '__EMPTY_23']
};

// Helper function to find matching column
function findMatchingColumn(headers: string[], possibleNames: string[]): string | undefined {
  return headers.find(header =>
    possibleNames.some(name =>
      header?.toLowerCase().trim() === name.toLowerCase().trim()
    )
  );
}

// Helper function to get value from row using column mapping
function getValueFromRow(row: any, headers: string[], fieldName: string): any {
  const possibleNames = columnMappings[fieldName];
  const matchingColumn = findMatchingColumn(headers, possibleNames);
  return matchingColumn ? row[matchingColumn] : undefined;
}

// Helper function to parse dates from Excel
function parseExcelDate(value: any): string | undefined {
  if (!value) return undefined;

  try {
    if (typeof value === 'number') {
      // Handle Excel date number
      // Excel dates are number of days since 1900-01-01
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString();
    } else if (typeof value === 'string') {
      // Try parsing string date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  } catch (error) {
    console.error('Error parsing date:', value, error);
  }
  return undefined;
}

// Preview projects from Excel
router.post("/preview", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Processing preview data...');

    // Get headers from first row
    const headers = Object.keys(rawData[0] || {});
    console.log('Found headers:', headers);

    // Process preview data
    const processedData = rawData.map(row => {
      const project: any = {
        projectNumber: getValueFromRow(row, headers, 'projectNumber'),
        location: getValueFromRow(row, headers, 'location'),
        team: getValueFromRow(row, headers, 'team'),
        status: getValueFromRow(row, headers, 'status'),
        contractDate: parseExcelDate(getValueFromRow(row, headers, 'contractDate')),
        chassisEta: parseExcelDate(getValueFromRow(row, headers, 'chassisEta')),
        paymentMilestones: getValueFromRow(row, headers, 'paymentMilestones'),
        lltsOrdered: getValueFromRow(row, headers, 'lltsOrdered'),
        meAssigned: getValueFromRow(row, headers, 'meAssigned'),
        meCadProgress: getValueFromRow(row, headers, 'meCadProgress'),
        eeAssigned: getValueFromRow(row, headers, 'eeAssigned'),
        eeDesignProgress: getValueFromRow(row, headers, 'eeDesignProgress'),
        itDesignProgress: getValueFromRow(row, headers, 'itDesignProgress'),
        ntcDesignProgress: getValueFromRow(row, headers, 'ntcDesignProgress'),
        ntcAssigned: getValueFromRow(row, headers, 'ntcAssigned'),
        notes: getValueFromRow(row, headers, 'notes') || '',
        fabricationStart: parseExcelDate(getValueFromRow(row, headers, 'fabricationStart')),
        assemblyStart: parseExcelDate(getValueFromRow(row, headers, 'assemblyStart')),
        wrapGraphics: parseExcelDate(getValueFromRow(row, headers, 'wrapGraphics')),
        ntcTesting: parseExcelDate(getValueFromRow(row, headers, 'ntcTesting')),
        qcStart: parseExcelDate(getValueFromRow(row, headers, 'qcStart')),
        executiveReview: parseExcelDate(getValueFromRow(row, headers, 'executiveReview')),
        ship: parseExcelDate(getValueFromRow(row, headers, 'ship')),
        delivery: parseExcelDate(getValueFromRow(row, headers, 'delivery'))
      };


      return project;
    });

    res.status(200).json({
      message: "Projects preview generated successfully",
      count: processedData.length,
      projects: processedData
    });

  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({
      error: "Failed to generate preview",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import projects
router.post("/import", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Parsing Excel data...');

    // Get headers from first row
    const headers = Object.keys(rawData[0] || {});
    console.log('Found headers:', headers);

    const importedProjects = [];
    const now = new Date().toISOString();

    for (const row of rawData) {
      const projectId = uuidv4();

      // Map fields using column mappings
      const project = {
        id: projectId,
        projectNumber: getValueFromRow(row, headers, 'projectNumber'),
        location: getValueFromRow(row, headers, 'location'),
        team: getValueFromRow(row, headers, 'team'),
        status: 'NOT_STARTED',
        manualStatus: false,
        contractDate: parseExcelDate(getValueFromRow(row, headers, 'contractDate')),
        chassisEta: parseExcelDate(getValueFromRow(row, headers, 'chassisEta')),
        paymentMilestones: getValueFromRow(row, headers, 'paymentMilestones'),
        lltsOrdered: getValueFromRow(row, headers, 'lltsOrdered'),
        meAssigned: getValueFromRow(row, headers, 'meAssigned'),
        meCadProgress: getValueFromRow(row, headers, 'meCadProgress'),
        eeAssigned: getValueFromRow(row, headers, 'eeAssigned'),
        eeDesignProgress: getValueFromRow(row, headers, 'eeDesignProgress'),
        itDesignProgress: getValueFromRow(row, headers, 'itDesignProgress'),
        ntcDesignProgress: getValueFromRow(row, headers, 'ntcDesignProgress'),
        ntcAssigned: getValueFromRow(row, headers, 'ntcAssigned'),
        notes: getValueFromRow(row, headers, 'notes') || '',
        fabricationStart: parseExcelDate(getValueFromRow(row, headers, 'fabricationStart')),
        assemblyStart: parseExcelDate(getValueFromRow(row, headers, 'assemblyStart')),
        wrapGraphics: parseExcelDate(getValueFromRow(row, headers, 'wrapGraphics')),
        ntcTesting: parseExcelDate(getValueFromRow(row, headers, 'ntcTesting')),
        qcStart: parseExcelDate(getValueFromRow(row, headers, 'qcStart')),
        executiveReview: parseExcelDate(getValueFromRow(row, headers, 'executiveReview')),
        ship: parseExcelDate(getValueFromRow(row, headers, 'ship')),
        delivery: parseExcelDate(getValueFromRow(row, headers, 'delivery')),
        createdAt: now,
        updatedAt: now
      };

      // Save to Azure Blob Storage
      const blockBlobClient = containerClient.getBlockBlobClient(`${projectId}.json`);
      const content = JSON.stringify(project);

      await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: {
          blobContentType: "application/json"
        }
      });

      importedProjects.push(project);
    }

    res.status(200).json({
      message: "Projects imported successfully",
      count: importedProjects.length,
      projects: importedProjects
    });

  } catch (error) {
    console.error("Error importing projects:", error);
    res.status(500).json({
      error: "Failed to import projects",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlockBlobClient(blob.name);
      const downloadResponse = await blobClient.download();
      const projectData = await streamToString(downloadResponse.readableStreamBody);
      projects.push(JSON.parse(projectData));
    }
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const blobClient = containerClient.getBlockBlobClient(`${req.params.id}.json`);
    const downloadResponse = await blobClient.download();
    const projectData = await streamToString(downloadResponse.readableStreamBody);
    try {
      const parsedData = JSON.parse(projectData.trim());
      res.json(parsedData);
    } catch (error) {
      console.error("Error parsing project data:", error);
      res.status(500).json({ error: "Invalid project data format" });
    }
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: "Project not found" });
    } else {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  }
});

// Update project
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('Updating project:', id, 'with:', updates);

    // Get current project
    const blobClient = containerClient.getBlockBlobClient(`${id}.json`);
    const downloadResponse = await blobClient.download();
    const currentProjectData = await streamToString(downloadResponse.readableStreamBody);
    const currentProject = JSON.parse(currentProjectData);

    // Merge updates with current project
    const updatedProject = {
      ...currentProject,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Upload updated project
    await blobClient.upload(JSON.stringify(updatedProject), JSON.stringify(updatedProject).length, {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    return "";
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}

// Delete single project
router.delete("/:id", async (req, res) => {
  try {
    const blobClient = containerClient.getBlockBlobClient(`${req.params.id}.json`);
    await blobClient.delete();
    res.setHeader('Content-Type', 'application/json');
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;