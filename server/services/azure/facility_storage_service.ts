import { BlobServiceClient } from "@azure/storage-blob";
import { Container } from "@azure/cosmos";
import { getContainer } from "./cosmos_service";
import { getBlobServiceClient } from "./blob_service";

interface BuildingComponent {
  id: number;
  type: 'wall' | 'door' | 'window' | 'floor' | 'ceiling';
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  material?: any;
}

interface BuildingData {
  id: string;
  name: string;
  components: BuildingComponent[];
  lastModified: string;
  createdAt: string;
  version: number;
}

interface ModelMetadata {
  modelId: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: number;
  format: string;
  associatedEquipmentId?: string;
}

class FacilityStorageService {
  private buildingsContainer: Container;
  private modelsContainer: string = "facility-models";
  private blobServiceClient: BlobServiceClient | null = null;

  constructor() {
    this.buildingsContainer = getContainer('building-systems')!;
    this.initialize();
  }

  private async initialize() {
    this.blobServiceClient = await getBlobServiceClient();
    if (this.blobServiceClient) {
      const containerClient = this.blobServiceClient.getContainerClient(this.modelsContainer);
      await containerClient.createIfNotExists({
        access: 'blob'
      });
    }
  }

  async saveBuildingData(buildingData: BuildingData): Promise<BuildingData> {
    try {
      const { resource } = await this.buildingsContainer.items.upsert({
        ...buildingData,
        lastModified: new Date().toISOString()
      });
      return resource;
    } catch (error) {
      console.error("Error saving building data:", error);
      throw new Error("Failed to save building data");
    }
  }

  async getBuildingData(buildingId: string): Promise<BuildingData | null> {
    try {
      const { resource } = await this.buildingsContainer.item(buildingId, buildingId).read();
      return resource || null;
    } catch (error) {
      console.error("Error retrieving building data:", error);
      return null;
    }
  }

  async uploadModel(file: Buffer, metadata: ModelMetadata): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error("Blob storage not initialized");
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.modelsContainer);
      const blobName = `${metadata.modelId}.glb`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file, file.length, {
        metadata: {
          name: metadata.name,
          type: metadata.type,
          uploadedAt: metadata.uploadedAt,
          format: metadata.format,
          associatedEquipmentId: metadata.associatedEquipmentId || ''
        }
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error("Error uploading model:", error);
      throw new Error("Failed to upload model");
    }
  }

  async listModels(): Promise<ModelMetadata[]> {
    if (!this.blobServiceClient) {
      throw new Error("Blob storage not initialized");
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.modelsContainer);
      const models: ModelMetadata[] = [];

      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.metadata) {
          models.push({
            modelId: blob.name.replace('.glb', ''),
            name: blob.metadata.name,
            type: blob.metadata.type,
            uploadedAt: blob.metadata.uploadedAt,
            size: blob.properties.contentLength || 0,
            format: blob.metadata.format,
            associatedEquipmentId: blob.metadata.associatedEquipmentId
          });
        }
      }

      return models;
    } catch (error) {
      console.error("Error listing models:", error);
      throw new Error("Failed to list models");
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    if (!this.blobServiceClient) {
      throw new Error("Blob storage not initialized");
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.modelsContainer);
      const blockBlobClient = containerClient.getBlockBlobClient(`${modelId}.glb`);
      await blockBlobClient.delete();
    } catch (error) {
      console.error("Error deleting model:", error);
      throw new Error("Failed to delete model");
    }
  }
}

export const facilityStorage = new FacilityStorageService();
