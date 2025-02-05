import { Container, CosmosClient, Database } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";

interface Deal {
  id: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  owner: string;
  manufacturingProject: string;
  lastContact: string;
  score: number;
  qualificationStatus: string;
  nextSteps: string;
  engagement: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  lastContact: string;
  deals: number;
  createdAt: string;
  updatedAt: string;
}

interface PipelineStage {
  id: string;
  name: string;
  deals: number;
  value: number;
  updatedAt: string;
}

export class SalesService {
  private client: CosmosClient;
  private database!: Database;
  private dealsContainer!: Container;
  private contactsContainer!: Container;
  private pipelineContainer!: Container;
  private blobServiceClient: BlobServiceClient;
  private salesBlobContainer: string = "sales-data";

  constructor() {
    if (!process.env.NOMAD_AZURE_COSMOS_ENDPOINT || !process.env.NOMAD_AZURE_COSMOS_KEY) {
      throw new Error("Azure Cosmos DB configuration missing");
    }

    this.client = new CosmosClient({
      endpoint: process.env.NOMAD_AZURE_COSMOS_ENDPOINT,
      key: process.env.NOMAD_AZURE_COSMOS_KEY
    });

    // Initialize Blob Storage Client
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Azure Storage connection string not found");
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async initialize() {
    try {
      // Initialize Cosmos DB
      this.database = await this.client.databases.createIfNotExists({
        id: "sales-management"
      }).then(response => response.database);

      // Initialize containers
      this.dealsContainer = await this.database.containers.createIfNotExists({
        id: "deals",
        partitionKey: "/company"
      }).then(response => response.container);

      this.contactsContainer = await this.database.containers.createIfNotExists({
        id: "contacts",
        partitionKey: "/company"
      }).then(response => response.container);

      this.pipelineContainer = await this.database.containers.createIfNotExists({
        id: "pipeline",
        partitionKey: "/name"
      }).then(response => response.container);

      // Initialize Blob Container
      const containerClient = this.blobServiceClient.getContainerClient(this.salesBlobContainer);
      await containerClient.createIfNotExists();

      console.log("Sales service initialized successfully");
    } catch (error) {
      console.error("Error initializing sales service:", error);
      throw error;
    }
  }

  // Helper method for storing large data in Blob Storage
  private async storeLargeData(id: string, data: any): Promise<string> {
    const blobName = `${id}/${randomUUID()}.json`;
    const containerClient = this.blobServiceClient.getContainerClient(this.salesBlobContainer);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(JSON.stringify(data), JSON.stringify(data).length);
    return blobName;
  }

  // Helper method for retrieving large data from Blob Storage
  private async retrieveLargeData(blobName: string): Promise<any> {
    const containerClient = this.blobServiceClient.getContainerClient(this.salesBlobContainer);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await streamToString(downloadResponse.readableStreamBody);
    return JSON.parse(downloaded);
  }

  async createDeal(deal: Omit<Deal, "id" | "createdAt" | "updatedAt">): Promise<Deal> {
    const timestamp = new Date().toISOString();
    const id = randomUUID();

    // Store large data in Blob Storage if needed
    let blobReference;
    if (deal.manufacturingProject) {
      blobReference = await this.storeLargeData(id, {
        manufacturingDetails: deal.manufacturingProject,
        timestamp
      });
    }

    const newDeal: Deal = {
      id,
      ...deal,
      manufacturingProject: blobReference || deal.manufacturingProject,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.dealsContainer.items.create(newDeal);
    return newDeal;
  }

  async updateDeal(id: string, deal: Partial<Omit<Deal, "id">>): Promise<Deal> {
    const { resource: existingDeal } = await this.dealsContainer
      .item(id, deal.company!)
      .read<Deal>();

    if (!existingDeal) {
      throw new Error(`Deal with id ${id} not found`);
    }

    const updatedDeal: Deal = {
      ...existingDeal,
      ...deal,
      id: existingDeal.id,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await this.dealsContainer
      .item(id, updatedDeal.company)
      .replace<Deal>(updatedDeal);

    return resource!;
  }

  async getDeal(id: string, company: string): Promise<Deal | null> {
    try {
      const { resource } = await this.dealsContainer
        .item(id, company)
        .read<Deal>();

      if (resource && resource.manufacturingProject && resource.manufacturingProject.startsWith(id + '/')) {
        // Retrieve large data from Blob Storage
        const manufacturingDetails = await this.retrieveLargeData(resource.manufacturingProject);
        return {
          ...resource,
          manufacturingProject: manufacturingDetails.manufacturingDetails
        };
      }

      return resource || null;
    } catch (error) {
      console.error(`Error getting deal ${id}:`, error);
      return null;
    }
  }

  async listDeals(querySpec?: any): Promise<Deal[]> {
    const query = querySpec || {
      query: "SELECT * FROM c ORDER BY c.updatedAt DESC"
    };

    const { resources } = await this.dealsContainer.items
      .query<Deal>(query)
      .fetchAll();

    return resources;
  }

  // Contacts Management
  async createContact(contact: Omit<Contact, "id" | "createdAt" | "updatedAt">): Promise<Contact> {
    const timestamp = new Date().toISOString();
    const newContact: Contact = {
      id: randomUUID(),
      ...contact,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.contactsContainer.items.create(newContact);
    return newContact;
  }

  async updateContact(id: string, contact: Partial<Omit<Contact, "id">>): Promise<Contact> {
    const { resource: existingContact } = await this.contactsContainer
      .item(id, contact.company!)
      .read<Contact>();

    if (!existingContact) {
      throw new Error(`Contact with id ${id} not found`);
    }

    const updatedContact: Contact = {
      ...existingContact,
      ...contact,
      id: existingContact.id,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await this.contactsContainer
      .item(id, updatedContact.company)
      .replace<Contact>(updatedContact);

    return resource!;
  }

  async getContact(id: string, company: string): Promise<Contact | null> {
    try {
      const { resource } = await this.contactsContainer
        .item(id, company)
        .read<Contact>();
      return resource || null;
    } catch (error) {
      console.error(`Error getting contact ${id}:`, error);
      return null;
    }
  }

  async listContacts(querySpec?: any): Promise<Contact[]> {
    const query = querySpec || {
      query: "SELECT * FROM c ORDER BY c.updatedAt DESC"
    };

    const { resources } = await this.contactsContainer.items
      .query<Contact>(query)
      .fetchAll();

    return resources;
  }

  // Pipeline Management
  async updatePipelineStage(stage: PipelineStage): Promise<PipelineStage> {
    const timestamp = new Date().toISOString();
    const updatedStage: PipelineStage = {
      ...stage,
      updatedAt: timestamp
    };

    const { resource } = await this.pipelineContainer
      .item(stage.id, stage.name)
      .replace<PipelineStage>(updatedStage);

    return resource!;
  }

  async getPipelineStages(): Promise<PipelineStage[]> {
    const { resources } = await this.pipelineContainer.items
      .query<PipelineStage>({
        query: "SELECT * FROM c ORDER BY c.name ASC"
      })
      .fetchAll();

    return resources;
  }

  // Analytics and Reporting
  async getDealsByStage(): Promise<Record<string, { count: number; value: number }>> {
    const { resources } = await this.dealsContainer.items
      .query({
        query: "SELECT c.stage, COUNT(1) as count, SUM(c.value) as totalValue FROM c GROUP BY c.stage"
      })
      .fetchAll();

    return resources.reduce((acc, curr) => ({
      ...acc,
      [curr.stage]: { count: curr.count, value: curr.totalValue }
    }), {});
  }

  async getDealsTrend(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { resources } = await this.dealsContainer.items
      .query({
        query: "SELECT c.createdAt, c.value, c.stage FROM c WHERE c.createdAt >= @startDate",
        parameters: [{ name: "@startDate", value: startDate.toISOString() }]
      })
      .fetchAll();

    return resources;
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
export const salesService = new SalesService();