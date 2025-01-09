import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

let containerClient: ContainerClient | null = null;
const containerName = "documents";

export async function initializeBlobStorage() {
  try {
    if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
      console.warn("Azure Blob Storage connection string not configured. File storage will be disabled.");
      return;
    }

    const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING.trim();

    if (!connectionString) {
      console.warn("Azure Blob Storage connection string is empty. File storage will be disabled.");
      return;
    }

    if (!connectionString.includes("DefaultEndpointsProtocol=") ||
        !connectionString.includes("AccountName=") ||
        !connectionString.includes("AccountKey=")) {
      console.warn("Invalid Azure Blob Storage connection string format. File storage will be disabled.");
      return;
    }

    console.log("Attempting to connect to Azure Blob Storage...");

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    console.log("Successfully created Blob Service Client");

    containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists({
      access: 'blob'
    });

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

export async function getStorageMetrics() {
  try {
    if (!containerClient) {
      await initializeBlobStorage();
    }

    if (!containerClient) {
      console.warn("Blob Storage not initialized");
      return {
        totalDocuments: 0,
        totalSize: 0,
        documentTypes: {}
      };
    }

    let totalDocuments = 0;
    let totalSize = 0;
    const documentTypes: Record<string, number> = {};

    for await (const blob of containerClient.listBlobsFlat()) {
      totalDocuments++;
      totalSize += blob.properties.contentLength || 0;

      const extension = blob.name.split('.').pop()?.toLowerCase() || 'unknown';
      documentTypes[extension] = (documentTypes[extension] || 0) + 1;
    }

    return {
      totalDocuments,
      totalSize,
      documentTypes
    };
  } catch (error) {
    console.error("Error getting storage metrics:", error);
    return {
      totalDocuments: 0,
      totalSize: 0,
      documentTypes: {}
    };
  }
}

export async function trackStorageActivity(activity: {
  type: 'upload' | 'download' | 'delete' | 'view';
  documentName: string;
  userId?: string;
  timestamp?: Date;
}) {
  try {
    if (!containerClient) {
      console.warn("Blob Storage not initialized");
      return null;
    }

    const activityBlob = containerClient.getBlockBlobClient(
      `__activity_logs/${new Date().toISOString()}_${activity.type}_${activity.documentName}.json`
    );

    await activityBlob.uploadData(Buffer.from(JSON.stringify({
      ...activity,
      timestamp: activity.timestamp || new Date(),
    })));

    return true;
  } catch (error) {
    console.error("Error tracking activity:", error);
    return null;
  }
}

export async function getRecentActivity(limit: number = 10) {
  try {
    if (!containerClient) {
      console.warn("Blob Storage not initialized");
      return [];
    }

    const activities = [];
    const activityIterator = containerClient
      .listBlobsFlat({ prefix: '__activity_logs/' })
      .byPage({ maxPageSize: limit });

    for await (const response of activityIterator) {
      for (const blob of response.segment.blobItems) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const content = await streamToBuffer(downloadResponse.readableStreamBody!);
        activities.push(JSON.parse(content.toString()));
      }
    }

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return [];
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}