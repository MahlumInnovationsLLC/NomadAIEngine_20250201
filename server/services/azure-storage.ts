import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Azure Storage connection string not found");
    }
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER || "member-data");
  }

  async uploadMemberData(memberId: string, data: any): Promise<string> {
    const blobName = `members/${memberId}/${randomUUID()}.json`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      await blockBlobClient.upload(JSON.stringify(data), JSON.stringify(data).length);
      return blobName;
    } catch (error) {
      console.error("Error uploading member data to Azure:", error);
      throw new Error("Failed to upload member data");
    }
  }

  async getMemberData(blobName: string): Promise<any> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    try {
      const downloadResponse = await blockBlobClient.download(0);
      const data = await streamToString(downloadResponse.readableStreamBody);
      return JSON.parse(data);
    } catch (error) {
      console.error("Error retrieving member data from Azure:", error);
      throw new Error("Failed to retrieve member data");
    }
  }

  async listMemberData(memberId: string): Promise<string[]> {
    const prefix = `members/${memberId}/`;
    const blobs: string[] = [];
    
    try {
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        blobs.push(blob.name);
      }
      return blobs;
    } catch (error) {
      console.error("Error listing member data from Azure:", error);
      throw new Error("Failed to list member data");
    }
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    throw new Error("No readable stream provided");
  }

  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

// Create and export a singleton instance
export const azureStorage = new AzureStorageService();
