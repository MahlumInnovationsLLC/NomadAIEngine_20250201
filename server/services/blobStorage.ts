import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { createHash } from "crypto";

if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
  throw new Error("AZURE_BLOB_CONNECTION_STRING environment variable is required");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_BLOB_CONNECTION_STRING
);

const CONTAINER_NAME = "documents";

export async function initializeBlobStorage() {
  try {
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists({
      access: "private",
    });
    console.log("Blob storage container initialized");
  } catch (error) {
    console.error("Error initializing blob storage:", error);
    throw error;
  }
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
}> {
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
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

  const url = blockBlobClient.url;
  
  return {
    url,
    path: blobPath,
    checksum,
    size: file.length,
  };
}

export async function downloadDocument(blobPath: string): Promise<Buffer> {
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  
  const downloadResponse = await blockBlobClient.download(0);
  
  return await streamToBuffer(downloadResponse.readableStreamBody!);
}

export async function getDocumentMetadata(blobPath: string) {
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  
  const properties = await blockBlobClient.getProperties();
  return {
    metadata: properties.metadata,
    contentType: properties.contentType,
    size: properties.contentLength,
    createdOn: properties.createdOn,
    lastModified: properties.lastModified,
  };
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
