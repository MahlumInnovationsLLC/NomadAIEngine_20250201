import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Container names - maintain existing documents container
export const CONTAINERS = {
  DOCUMENTS: 'documents',
  EQUIPMENT_BACKUPS: 'equipment-backups',
} as const;

class AzureBlobStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containers: Map<string, ContainerClient> = new Map();
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING;
    if (!connectionString) {
      console.log("No Azure Blob Storage connection string found, storage features will be disabled");
      return false;
    }

    try {
      console.log("Initializing Azure Blob Storage...");
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

      // Initialize containers
      await this.initializeContainers();

      this.initialized = true;
      console.log("✓ Azure Blob Storage initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Azure Blob Storage:", error);
      return false;
    }
  }

  private async initializeContainers(): Promise<void> {
    if (!this.blobServiceClient) throw new Error("Blob service client not initialized");

    for (const containerName of Object.values(CONTAINERS)) {
      try {
        console.log(`Creating container if not exists: ${containerName}`);
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({
          access: 'container' // Public access at container level
        });
        this.containers.set(containerName, containerClient);
      } catch (error) {
        console.error(`Failed to initialize container ${containerName}:`, error);
        throw error;
      }
    }
  }

  getContainerClient(containerName: string): ContainerClient | null {
    return this.containers.get(containerName) || null;
  }

  async uploadBlob(containerName: string, blobName: string, content: string | Buffer): Promise<boolean> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return false;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      if (typeof content === 'string') {
        await blockBlobClient.upload(content, content.length);
      } else {
        await blockBlobClient.upload(content, content.length);
      }
      console.log(`✓ Successfully uploaded blob: ${blobName}`);
      return true;
    } catch (error) {
      console.error(`Failed to upload blob ${blobName}:`, error);
      return false;
    }
  }

  async downloadBlob(containerName: string, blobName: string): Promise<string | null> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return null;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download(0);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        if (!downloadResponse.readableStreamBody) {
          reject(new Error('No readable stream available'));
          return;
        }

        downloadResponse.readableStreamBody
          .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          .on('error', reject)
          .on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      });
    } catch (error) {
      console.error(`Failed to download blob ${blobName}:`, error);
      return null;
    }
  }

  // DocExplorer specific methods - maintain existing functionality
  async createFolder(containerName: string, folderPath: string): Promise<boolean> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return false;
    }

    try {
      // Create a zero-length blob to represent the folder
      const blockBlobClient = containerClient.getBlockBlobClient(`${folderPath}.folder`);
      await blockBlobClient.upload(Buffer.from(''), 0);
      console.log(`✓ Created folder: ${folderPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to create folder ${folderPath}:`, error);
      return false;
    }
  }

  async getBlob(containerName: string, blobName: string): Promise<{ content: string; metadata?: any } | null> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return null;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const [content, properties] = await Promise.all([
        this.downloadBlob(containerName, blobName),
        blockBlobClient.getProperties()
      ]);

      if (!content) return null;

      return {
        content,
        metadata: properties.metadata
      };
    } catch (error) {
      console.error(`Failed to get blob ${blobName}:`, error);
      return null;
    }
  }

  async updateBlob(containerName: string, blobName: string, content: string, options?: { revision?: string }): Promise<boolean> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return false;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(content, content.length, {
        metadata: options?.revision ? { revision: options.revision } : undefined,
        blobHTTPHeaders: {
          blobContentType: 'text/html'
        }
      });
      console.log(`✓ Updated blob: ${blobName}`);
      return true;
    } catch (error) {
      console.error(`Failed to update blob ${blobName}:`, error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const azureBlobStorage = new AzureBlobStorageService();

// Initialize on module load
console.log("Initializing Azure Blob Storage service...");
azureBlobStorage.initialize().catch(error => {
  console.error("Failed to initialize Azure Blob Storage service:", error);
});