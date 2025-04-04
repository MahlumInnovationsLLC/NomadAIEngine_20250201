import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

// Centralized Azure Blob Storage service
let blobServiceClient: BlobServiceClient | null = null;
let containers: Map<string, ContainerClient> = new Map();
let defaultContainerClient: ContainerClient | null = null; // For backward compatibility

// Standard container names to maintain consistency across the app
export const containerNames = {
  DOCUMENTS: "manufacturing-documents",
  PROJECTS: "production-projects",
  MEMBER_DATA: "member-data",
  QUALITY_TEMPLATES: "quality-templates",
  INSPECTION_ATTACHMENTS: "inspection-attachments",
  NCR_ATTACHMENTS: "ncr-attachments",
  MILESTONES: "project-milestones"
};

/**
 * Get a shared BlobServiceClient instance
 * Uses NOMAD_AZURE_STORAGE_CONNECTION_STRING as the primary connection string
 */
export async function getBlobServiceClient() {
  if (blobServiceClient) return blobServiceClient;

  // Use NOMAD_AZURE_STORAGE_CONNECTION_STRING as the standard connection string across the app
  const connectionString = process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || 
                         process.env.NOMAD_AZURE_BLOB_CONNECTION_STRING;

  if (!connectionString) {
    console.warn("Azure Blob Storage connection string not configured. File storage will be disabled.");
    return null;
  }

  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    console.log("Successfully initialized shared Azure Blob Service Client");
    return blobServiceClient;
  } catch (error) {
    console.error("Error initializing Blob Service Client:", error);
    return null;
  }
}

/**
 * Initialize the Azure Blob Storage service with error handling and validation
 */
export async function initializeBlobStorage() {
  try {
    const connectionString = process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || 
                           process.env.NOMAD_AZURE_BLOB_CONNECTION_STRING;

    if (!connectionString) {
      console.warn("Azure Blob Storage connection string not configured. File storage will be disabled.");
      return;
    }

    const trimmedString = connectionString.trim();

    if (!trimmedString) {
      console.warn("Azure Blob Storage connection string is empty. File storage will be disabled.");
      return;
    }

    if (!trimmedString.includes("DefaultEndpointsProtocol=") ||
        !trimmedString.includes("AccountName=") ||
        !trimmedString.includes("AccountKey=")) {
      console.warn("Invalid Azure Blob Storage connection string format. File storage will be disabled.");
      return;
    }

    console.log("Attempting to connect to Azure Blob Storage...");

    blobServiceClient = BlobServiceClient.fromConnectionString(trimmedString);
    console.log("Successfully created Blob Service Client");

    // Initialize the default containers
    await getContainerClient(containerNames.DOCUMENTS);
    await getContainerClient(containerNames.PROJECTS);

    console.log("Successfully verified Azure Blob Storage connection");

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
    // Clear service client and containers map
    containers.clear();
    blobServiceClient = null;
  }
}

// Initialize on module load
initializeBlobStorage().catch(console.error);

/**
 * Get or create a container client for a specific container
 * This ensures containers are created if they don't exist
 */
export async function getContainerClient(containerName: string): Promise<ContainerClient | null> {
  // Check if we already have this container cached
  if (containers.has(containerName)) {
    return containers.get(containerName)!;
  }
  
  try {
    // Get or initialize the blob service client
    const client = await getBlobServiceClient();
    if (!client) {
      console.warn(`Cannot get container "${containerName}" - blob service client not available`);
      return null;
    }
    
    // Get the container client
    const container = client.getContainerClient(containerName);
    
    // Create the container if it doesn't exist
    const exists = await container.exists();
    if (!exists) {
      console.log(`Container "${containerName}" does not exist, creating...`);
      await container.create({ access: 'blob' });
      console.log(`Container "${containerName}" created successfully`);
    } else {
      console.log(`Container "${containerName}" verified/created`);
    }
    
    // Cache the container for future use
    containers.set(containerName, container);
    
    // For backward compatibility
    if (containerName === containerNames.DOCUMENTS) {
      defaultContainerClient = container;
    }
    
    return container;
  } catch (error) {
    console.error(`Error getting container "${containerName}":`, error);
    return null;
  }
}

export async function checkBlobStorageConnection(): Promise<boolean> {
  try {
    // Get the default container client
    if (!defaultContainerClient) {
      defaultContainerClient = await getContainerClient(containerNames.DOCUMENTS);
    }

    if (!defaultContainerClient) {
      return false;
    }

    const testIterator = defaultContainerClient.listBlobsFlat().byPage({ maxPageSize: 1 });
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
  containerName: string = containerNames.DOCUMENTS,
  metadata?: Record<string, string>
) {
  try {
    const container = await getContainerClient(containerName);
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. File operations will be skipped.`);
      return null;
    }

    console.log(`Attempting to upload file: ${filename} to container: ${containerName}`);
    const blockBlobClient = container.getBlockBlobClient(filename);
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

export async function downloadFile(
  filename: string,
  containerName: string = containerNames.DOCUMENTS
) {
  try {
    const container = await getContainerClient(containerName);
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. File operations will be skipped.`);
      return null;
    }

    const blockBlobClient = container.getBlockBlobClient(filename);
    return await blockBlobClient.download(0);
  } catch (error) {
    console.error(`Error downloading file ${filename} from Blob Storage:`, error);
    return null;
  }
}

export async function deleteFile(
  filename: string,
  containerName: string = containerNames.DOCUMENTS
) {
  try {
    const container = await getContainerClient(containerName);
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. File operations will be skipped.`);
      return;
    }

    const blockBlobClient = container.getBlockBlobClient(filename);
    await blockBlobClient.delete();
    console.log(`Successfully deleted file: ${filename} from container: ${containerName}`);
  } catch (error) {
    console.error(`Error deleting file ${filename} from Blob Storage:`, error);
  }
}

export async function listFiles(
  prefix?: string,
  containerName: string = containerNames.DOCUMENTS
) {
  try {
    const container = await getContainerClient(containerName);
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. File operations will be skipped.`);
      return [];
    }

    const files = [];
    for await (const blob of container.listBlobsFlat({ prefix })) {
      files.push({
        name: blob.name,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        metadata: blob.metadata
      });
    }
    return files;
  } catch (error) {
    console.error(`Error listing files from Blob Storage container "${containerName}":`, error);
    return [];
  }
}

export async function getStorageMetrics(containerName: string = containerNames.DOCUMENTS) {
  try {
    const container = await getContainerClient(containerName);
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. Cannot get metrics.`);
      return {
        totalDocuments: 0,
        totalSize: 0,
        documentTypes: {}
      };
    }

    let totalDocuments = 0;
    let totalSize = 0;
    const documentTypes: Record<string, number> = {};

    for await (const blob of container.listBlobsFlat()) {
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
    console.error(`Error getting storage metrics for container "${containerName}":`, error);
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
  containerName?: string;
}) {
  try {
    const containerName = activity.containerName || containerNames.DOCUMENTS;
    const container = await getContainerClient(containerName);
    
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. Cannot track activity.`);
      return null;
    }

    const activityBlob = container.getBlockBlobClient(
      `__activity_logs/${new Date().toISOString()}_${activity.type}_${activity.documentName}.json`
    );

    await activityBlob.uploadData(Buffer.from(JSON.stringify({
      ...activity,
      containerName,
      timestamp: activity.timestamp || new Date(),
    })));

    return true;
  } catch (error) {
    console.error("Error tracking activity:", error);
    return null;
  }
}

export async function getRecentActivity(limit: number = 10, containerName: string = containerNames.DOCUMENTS) {
  try {
    const container = await getContainerClient(containerName);
    if (!container) {
      console.warn(`Blob Storage container "${containerName}" not available. Cannot get recent activity.`);
      return [];
    }

    const activities = [];
    const activityIterator = container
      .listBlobsFlat({ prefix: '__activity_logs/' })
      .byPage({ maxPageSize: limit });

    for await (const response of activityIterator) {
      for (const blob of response.segment.blobItems) {
        const blobClient = container.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const content = await streamToBuffer(downloadResponse.readableStreamBody!);
        activities.push(JSON.parse(content.toString()));
      }
    }

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error(`Error getting recent activity from container "${containerName}":`, error);
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