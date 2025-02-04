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

// Import projects from Excel
router.post("/import", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('Parsed Excel data:', data);

    const importedProjects = [];
    const now = new Date().toISOString();

    for (const row of data) {
      const projectId = uuidv4();

      // Convert Excel date numbers to ISO strings where applicable
      const dateFields = ['contractDate', 'fabricationStart', 'assemblyStart', 'wrapGraphics', 
                         'ntcTesting', 'qcStart', 'ship', 'delivery', 'executiveReview'];

      const processedRow = { ...row };
      for (const field of dateFields) {
        if (row[field]) {
          // Check if it's an Excel date number
          if (typeof row[field] === 'number') {
            const date = XLSX.SSF.parse_date_code(row[field]);
            processedRow[field] = new Date(date.y, date.m - 1, date.d).toISOString();
          } else if (typeof row[field] === 'string') {
            // Try to parse the string date
            const date = new Date(row[field]);
            if (!isNaN(date.getTime())) {
              processedRow[field] = date.toISOString();
            }
          }
        }
      }

      const project = {
        id: projectId,
        ...processedRow,
        status: 'NOT_STARTED',
        manualStatus: false,
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

// Preview projects from Excel
router.post("/preview", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('Preview Excel data:', data);

    // Process dates in the preview data
    const processedData = data.map(row => {
      const dateFields = ['contractDate', 'fabricationStart', 'assemblyStart', 'wrapGraphics', 
                         'ntcTesting', 'qcStart', 'ship', 'delivery', 'executiveReview'];

      const processedRow = { ...row };
      for (const field of dateFields) {
        if (row[field]) {
          if (typeof row[field] === 'number') {
            const date = XLSX.SSF.parse_date_code(row[field]);
            processedRow[field] = new Date(date.y, date.m - 1, date.d).toISOString();
          } else if (typeof row[field] === 'string') {
            const date = new Date(row[field]);
            if (!isNaN(date.getTime())) {
              processedRow[field] = date.toISOString();
            }
          }
        }
      }

      return processedRow;
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
    res.json(JSON.parse(projectData));
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: "Project not found" });
    } else {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  }
});

// Create new project
router.post("/", async (req, res) => {
  try {
    const projectId = uuidv4();
    const now = new Date().toISOString();

    const project = {
      id: projectId,
      ...req.body,
      status: 'not_started',
      progress: 0,
      createdAt: now,
      updatedAt: now
    };

    const blockBlobClient = containerClient.getBlockBlobClient(`${projectId}.json`);
    const content = JSON.stringify(project);

    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
router.patch("/:id", async (req, res) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(`${req.params.id}.json`);
    const downloadResponse = await blockBlobClient.download();
    const existingData = JSON.parse(await streamToString(downloadResponse.readableStreamBody));

    const updatedProject = {
      ...existingData,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const content = JSON.stringify(updatedProject);

    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      }
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

export default router;