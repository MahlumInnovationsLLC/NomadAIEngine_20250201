import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

let containerClient: ContainerClient | null = null;
const containerName = "documents";

export async function initializeBlobStorage() {
  try {
    if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
      console.warn("Azure Blob Storage connection string not configured. File storage will be disabled.");
      return;
    }

    // Clean and validate the connection string
    const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING.trim();

    if (!connectionString) {
      console.warn("Azure Blob Storage connection string is empty. File storage will be disabled.");
      return;
    }

    // Validate connection string format
    if (!connectionString.includes("DefaultEndpointsProtocol=") || 
        !connectionString.includes("AccountName=") || 
        !connectionString.includes("AccountKey=")) {
      console.warn("Invalid Azure Blob Storage connection string format. File storage will be disabled.");
      return;
    }

    // Log connection attempt (without exposing sensitive info)
    console.log("Attempting to connect to Azure Blob Storage...");

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // Log successful client creation
    console.log("Successfully created Blob Service Client");

    containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Allow public access to blobs
    });

    // Test the connection by listing blobs
    const testIterator = containerClient.listBlobsFlat().byPage({ maxPageSize: 1 });
    await testIterator.next();

    console.log("Successfully connected to Azure Blob Storage and verified container access");
  } catch (error) {
    console.error("Error initializing Blob Storage:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    containerClient = null;
  }
}

// Initialize on module load
initializeBlobStorage().catch(console.error);

export async function checkBlobStorageConnection(): Promise<boolean> {
  try {
    if (!containerClient) {
      await initializeBlobStorage();
    }

    if (!containerClient) {
      return false;
    }

    // Test the connection by listing blobs
    const testIterator = containerClient.listBlobsFlat().byPage({ maxPageSize: 1 });
    await testIterator.next();
    return true;
  } catch (error) {
    console.error("Error checking Blob Storage connection:", error);
    return false;
  }
}

export async function uploadFile(
  filename: string,
  content: Buffer,
  metadata?: Record<string, string>
) {
  if (!containerClient) {
    console.warn("Blob Storage not initialized. File operations will be skipped.");
    return null;
  }

  try {
    console.log(`Attempting to upload file: ${filename}`);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.uploadData(content, {
      metadata,
      blobHTTPHeaders: {
        blobContentType: "application/octet-stream"
      }
    });
    console.log(`Successfully uploaded file: ${filename}`);
    return blockBlobClient.url;
  } catch (error) {
    console.error(`Error uploading file ${filename} to Blob Storage:`, error);
    return null;
  }
}

export async function downloadFile(filename: string) {
  if (!containerClient) {
    console.warn("Blob Storage not initialized. File operations will be skipped.");
    return null;
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    return await blockBlobClient.download(0);
  } catch (error) {
    console.error(`Error downloading file ${filename} from Blob Storage:`, error);
    return null;
  }
}

export async function deleteFile(filename: string) {
  if (!containerClient) {
    console.warn("Blob Storage not initialized. File operations will be skipped.");
    return;
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.delete();
  } catch (error) {
    console.error(`Error deleting file ${filename} from Blob Storage:`, error);
  }
}

export async function listFiles(prefix?: string) {
  if (!containerClient) {
    console.warn("Blob Storage not initialized. File operations will be skipped.");
    return [];
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
    return [];
  }
}