
import { Router } from "express";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const containerName = "daily-requirements";

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

// Get all requirements
router.get("/", async (req, res) => {
  try {
    const requirements = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlockBlobClient(blob.name);
      const downloadResponse = await blobClient.download();
      const data = await streamToString(downloadResponse.readableStreamBody);
      requirements.push(JSON.parse(data));
    }
    res.json(requirements);
  } catch (error) {
    console.error("Error fetching requirements:", error);
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
});

// Create new requirement
router.post("/", async (req, res) => {
  try {
    const requirement = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString()
    };

    const blobClient = containerClient.getBlockBlobClient(`${requirement.id}.json`);
    const content = JSON.stringify(requirement);
    
    await blobClient.upload(content, content.length, {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });

    res.status(201).json(requirement);
  } catch (error) {
    console.error("Error creating requirement:", error);
    res.status(500).json({ error: "Failed to create requirement" });
  }
});

// Update requirement status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const blobClient = containerClient.getBlockBlobClient(`${id}.json`);
    const downloadResponse = await blobClient.download();
    const currentData = JSON.parse(await streamToString(downloadResponse.readableStreamBody));

    const updatedRequirement = {
      ...currentData,
      status,
      updatedAt: new Date().toISOString()
    };

    await blobClient.upload(JSON.stringify(updatedRequirement), JSON.stringify(updatedRequirement).length, {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });

    res.json(updatedRequirement);
  } catch (error) {
    console.error("Error updating requirement status:", error);
    res.status(500).json({ error: "Failed to update requirement status" });
  }
});

async function streamToString(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) return "";
  
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
