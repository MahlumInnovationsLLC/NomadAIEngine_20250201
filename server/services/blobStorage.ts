import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { createHash } from "crypto";

if (!process.env.NOMAD_AZURE_BLOB_CONNECTION_STRING) {
  throw new Error("NOMAD_AZURE_BLOB_CONNECTION_STRING environment variable is required");
}

// Create the BlobServiceClient with retries
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.NOMAD_AZURE_BLOB_CONNECTION_STRING
);

const CONTAINER_NAME = "documents";

export async function initializeBlobStorage() {
  try {
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Check if container exists and is accessible
    try {
      await containerClient.getProperties();
      console.log(`Successfully connected to container: ${CONTAINER_NAME}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Container doesn't exist, create it
        await containerClient.create({
          access: "blob" // Changed from "container" to "blob" for more secure access
        });
        console.log(`Created container: ${CONTAINER_NAME}`);
      } else {
        throw error;
      }
    }

    return containerClient;
  } catch (error) {
    console.error("Error initializing blob storage:", error);
    return null;
  }
}

let containerClientInstance: ReturnType<typeof blobServiceClient.getContainerClient> | null = null;

export async function getContainerClient() {
  if (!containerClientInstance) {
    containerClientInstance = await initializeBlobStorage();
  }
  return containerClientInstance;
}

export async function uploadDocument(
  file: Buffer,
  fileName: string,
  metadata: Record<string, string>
): Promise<{
  url: string;
  path: string;
  checksum: string;
  size: number;
} | null> {
  try {
    const containerClient = await getContainerClient();
    if (!containerClient) {
      console.error("Blob storage not initialized");
      return null;
    }

    const timestamp = new Date().toISOString();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blobPath = `${timestamp}_${sanitizedFileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    // Calculate checksum
    const checksum = createHash('sha256').update(file).digest('hex');

    // Upload file with metadata
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: metadata.mimeType,
      },
      metadata: {
        ...metadata,
        checksum,
        uploadedAt: timestamp,
      },
    });

    return {
      url: blockBlobClient.url,
      path: blobPath,
      checksum,
      size: file.length,
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
}

export async function downloadDocument(blobPath: string): Promise<Buffer | null> {
  try {
    const containerClient = await getContainerClient();
    if (!containerClient) {
      console.error("Blob storage not initialized");
      return null;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const downloadResponse = await blockBlobClient.download(0);
    return await streamToBuffer(downloadResponse.readableStreamBody!);
  } catch (error) {
    console.error("Error downloading document:", error);
    return null;
  }
}

export async function getDocumentMetadata(blobPath: string) {
  try {
    const containerClient = await getContainerClient();
    if (!containerClient) {
      console.error("Blob storage not initialized");
      return null;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const properties = await blockBlobClient.getProperties();
    return {
      metadata: properties.metadata,
      contentType: properties.contentType,
      size: properties.contentLength,
      createdOn: properties.createdOn,
      lastModified: properties.lastModified,
    };
  } catch (error) {
    console.error("Error getting document metadata:", error);
    return null;
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}