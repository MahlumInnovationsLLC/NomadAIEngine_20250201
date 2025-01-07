import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

let containerClient: ContainerClient | null = null;
const containerName = "documents";

export async function initializeBlobStorage() {
  try {
    if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
      console.warn("Azure Blob Storage connection string not configured. File storage will be disabled.");
      return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_BLOB_CONNECTION_STRING
    );

    containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Allow public access to blobs
    });
    console.log("Successfully connected to Azure Blob Storage");
  } catch (error) {
    console.error("Error initializing Blob Storage:", error);
    containerClient = null;
  }
}

// Initialize on module load
initializeBlobStorage().catch(console.error);

export async function uploadFile(
  filename: string,
  content: Buffer,
  metadata?: Record<string, string>
) {
  if (!containerClient) {
    throw new Error("Blob Storage not initialized. Please check your connection string.");
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.uploadData(content, {
      metadata,
      blobHTTPHeaders: {
        blobContentType: "application/octet-stream"
      }
    });
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading file to Blob Storage:", error);
    throw error;
  }
}

export async function downloadFile(filename: string) {
  if (!containerClient) {
    throw new Error("Blob Storage not initialized. Please check your connection string.");
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    return await blockBlobClient.download(0);
  } catch (error) {
    console.error("Error downloading file from Blob Storage:", error);
    throw error;
  }
}

export async function deleteFile(filename: string) {
  if (!containerClient) {
    throw new Error("Blob Storage not initialized. Please check your connection string.");
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.delete();
  } catch (error) {
    console.error("Error deleting file from Blob Storage:", error);
    throw error;
  }
}

export async function listFiles(prefix?: string) {
  if (!containerClient) {
    throw new Error("Blob Storage not initialized. Please check your connection string.");
  }

  try {
    const files = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      files.push({
        name: blob.name,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        metadata: blob.metadata
      });
    }
    return files;
  } catch (error) {
    console.error("Error listing files from Blob Storage:", error);
    throw error;
  }
}