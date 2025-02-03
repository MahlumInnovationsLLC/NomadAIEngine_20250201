import { Router } from "express";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const containerName = "production-projects";

// Initialize Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || ""
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists
async function ensureContainer() {
  try {
    await containerClient.createIfNotExists();
  } catch (error) {
    console.error("Error creating container:", error);
  }
}

ensureContainer();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
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
    const blobClient = containerClient.getBlobClient(`${req.params.id}.json`);
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

    const blobClient = containerClient.getBlobClient(`${projectId}.json`);
    const content = Buffer.from(JSON.stringify(project));

    await blobClient.upload(content, content.length, {
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
    const blobClient = containerClient.getBlobClient(`${req.params.id}.json`);
    const downloadResponse = await blobClient.download();
    const existingData = JSON.parse(await streamToString(downloadResponse.readableStreamBody));

    const updatedProject = {
      ...existingData,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const content = Buffer.from(JSON.stringify(updatedProject));

     await blobClient.upload(content, content.length, {
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