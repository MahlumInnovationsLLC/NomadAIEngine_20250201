import express from 'express';
import { blobServiceClient } from '../services/azure/blob-service';

const router = express.Router();
const DOCUMENTS_CONTAINER = "nomadaidatacontainer";

// Get document content
router.get("/:path*/content", async (req: any, res) => {
  try {
    const documentPath = req.params["path*"];
    console.log("Fetching document content for path:", documentPath);
    
    const containerClient = blobServiceClient.getContainerClient(DOCUMENTS_CONTAINER);
    const blockBlobClient = containerClient.getBlockBlobClient(documentPath);
    
    try {
      const downloadResponse = await blockBlobClient.download();
      const properties = await blockBlobClient.getProperties();
      
      if (!downloadResponse.readableStreamBody) {
        console.error("No content available for document:", documentPath);
        return res.status(404).json({ error: "No content available" });
      }

      // Read the stream into a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      res.json({
        content,
        version: properties.metadata?.version || '1.0',
        status: properties.metadata?.status || 'draft',
        lastModified: properties.lastModified?.toISOString() || new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error downloading document:", error);
      if (error.statusCode === 404) {
        return res.status(404).json({ error: "Document not found" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching document content:", error);
    res.status(500).json({ error: "Failed to fetch document content" });
  }
});

// Update document content
router.put("/content/:path*", async (req: any, res) => {
  try {
    const documentPath = decodeURIComponent(req.params.path + (req.params[0] || ''));
    const { content, version, status } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const containerClient = blobServiceClient.getContainerClient(DOCUMENTS_CONTAINER);
    const blockBlobClient = containerClient.getBlockBlobClient(documentPath);

    const metadata = {
      version: version || '1.0',
      status: status || 'draft',
      lastModified: new Date().toISOString()
    };

    await blockBlobClient.upload(content, content.length, {
      metadata,
      blobHTTPHeaders: {
        blobContentType: "text/html",
      },
    });

    res.json({ message: "Document updated successfully" });
  } catch (error) {
    console.error("Error updating document content:", error);
    res.status(500).json({ error: "Failed to update document content" });
  }
});

export default router;
