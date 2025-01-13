import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

// Container names
export const CONTAINERS = {
  DOCUMENTS: 'documents',
  EQUIPMENT: 'equipment-data'
} as const;

class AzureBlobStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containers: Map<string, ContainerClient> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (!process.env.AZURE_BLOB_CONNECTION_STRING) {
        throw new Error("AZURE_BLOB_CONNECTION_STRING environment variable is required");
      }

      console.log("Initializing Azure Blob Storage...");
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_BLOB_CONNECTION_STRING
      );

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

        // Documents container needs blob-level public access for the DocExplorer
        await containerClient.createIfNotExists({
          access: containerName === CONTAINERS.DOCUMENTS ? 'blob' : undefined
        });

        this.containers.set(containerName, containerClient);
        console.log(`✓ Container ${containerName} initialized`);
      } catch (error) {
        console.error(`Failed to initialize container ${containerName}:`, error);
        throw error;
      }
    }
  }

  private getContainerClient(containerName: string): ContainerClient | null {
    return this.containers.get(containerName) || null;
  }

  async uploadBlob(
    containerName: string,
    blobName: string,
    content: Buffer | string,
    metadata?: Record<string, string>
  ): Promise<string | null> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return null;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(content, Buffer.byteLength(content instanceof Buffer ? content : content), {
        metadata,
        blobHTTPHeaders: {
          blobContentType: metadata?.contentType || 'application/octet-stream'
        }
      });
      console.log(`✓ Successfully uploaded blob: ${blobName}`);
      return blockBlobClient.url;
    } catch (error) {
      console.error(`Failed to upload blob ${blobName}:`, error);
      return null;
    }
  }

  async downloadBlob(containerName: string, blobName: string): Promise<Buffer | null> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return null;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download(0);

      if (!downloadResponse.readableStreamBody) {
        throw new Error("No readable stream available");
      }

      return await this.streamToBuffer(downloadResponse.readableStreamBody);
    } catch (error) {
      console.error(`Failed to download blob ${blobName}:`, error);
      return null;
    }
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
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

  async listBlobs(containerName: string, prefix?: string): Promise<Array<{
    name: string;
    url: string;
    metadata?: Record<string, string>;
    properties: {
      createdOn?: Date;
      lastModified?: Date;
      contentLength?: number;
    };
  }>> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return [];
    }

    try {
      const blobs = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        blobs.push({
          name: blob.name,
          url: blockBlobClient.url,
          metadata: blob.metadata,
          properties: {
            createdOn: blob.properties.createdOn,
            lastModified: blob.properties.lastModified,
            contentLength: blob.properties.contentLength
          }
        });
      }
      return blobs;
    } catch (error) {
      console.error(`Failed to list blobs in ${containerName}:`, error);
      return [];
    }
  }

  async deleteBlob(containerName: string, blobName: string): Promise<boolean> {
    const containerClient = this.getContainerClient(containerName);
    if (!containerClient) {
      console.error(`Container ${containerName} not initialized`);
      return false;
    }

    try {
      await containerClient.deleteBlob(blobName);
      return true;
    } catch (error) {
      console.error(`Failed to delete blob ${blobName}:`, error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Create and export singleton instance
export const azureBlobStorage = new AzureBlobStorageService();

// Initialize on module load
azureBlobStorage.initialize().catch(console.error);