import { Container, CosmosClient, Database } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";
import type { ServiceTicket, CustomerFeedbackItem } from "@/types/field-service";

export class FieldServiceManager {
  private client: CosmosClient;
  private database!: Database;
  private ticketsContainer!: Container;
  private feedbackContainer!: Container;
  private blobServiceClient: BlobServiceClient;
  private fieldServiceBlobContainer: string = "field-service-data";

  constructor() {
    if (!process.env.NOMAD_AZURE_COSMOS_ENDPOINT || !process.env.NOMAD_AZURE_COSMOS_KEY) {
      throw new Error("Azure Cosmos DB configuration missing");
    }

    this.client = new CosmosClient({
      endpoint: process.env.NOMAD_AZURE_COSMOS_ENDPOINT,
      key: process.env.NOMAD_AZURE_COSMOS_KEY
    });

    // Initialize Blob Storage Client
    const connectionString = process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Azure Storage connection string not found");
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async initialize() {
    try {
      // Initialize Cosmos DB
      this.database = await this.client.databases.createIfNotExists({
        id: "field-service"
      }).then(response => response.database);

      // Initialize containers
      this.ticketsContainer = await this.database.containers.createIfNotExists({
        id: "tickets",
        partitionKey: "/customer.company"
      }).then(response => response.container);

      this.feedbackContainer = await this.database.containers.createIfNotExists({
        id: "feedback",
        partitionKey: "/ticketId"
      }).then(response => response.container);

      // Initialize Blob Container
      const containerClient = this.blobServiceClient.getContainerClient(this.fieldServiceBlobContainer);
      await containerClient.createIfNotExists();

      console.log("Field service manager initialized successfully");
    } catch (error) {
      console.error("Error initializing field service manager:", error);
      throw error;
    }
  }

  async createTicket(ticketData: Omit<ServiceTicket, "id" | "createdAt" | "updatedAt">): Promise<ServiceTicket> {
    const timestamp = new Date().toISOString();
    const id = randomUUID();

    const newTicket: ServiceTicket = {
      id,
      ...ticketData,
      status: ticketData.status || 'open',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.ticketsContainer.items.create(newTicket);
    return newTicket;
  }

  async updateTicket(id: string, company: string, updates: Partial<ServiceTicket>): Promise<ServiceTicket> {
    const { resource: existingTicket } = await this.ticketsContainer
      .item(id, company)
      .read<ServiceTicket>();

    if (!existingTicket) {
      throw new Error(`Ticket with id ${id} not found`);
    }

    const updatedTicket: ServiceTicket = {
      ...existingTicket,
      ...updates,
      id: existingTicket.id,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await this.ticketsContainer
      .item(id, updatedTicket.customer.company)
      .replace<ServiceTicket>(updatedTicket);

    return resource!;
  }

  async getTicket(id: string, company: string): Promise<ServiceTicket | null> {
    try {
      const { resource } = await this.ticketsContainer
        .item(id, company)
        .read<ServiceTicket>();

      return resource || null;
    } catch (error) {
      console.error(`Error getting ticket ${id}:`, error);
      return null;
    }
  }

  async listTickets(querySpec?: any): Promise<ServiceTicket[]> {
    const query = querySpec || {
      query: "SELECT * FROM c ORDER BY c.updatedAt DESC"
    };

    const { resources } = await this.ticketsContainer.items
      .query<ServiceTicket>(query)
      .fetchAll();

    return resources;
  }

  async bulkCreateTickets(tickets: Array<Omit<ServiceTicket, "id" | "createdAt" | "updatedAt">>): Promise<ServiceTicket[]> {
    const timestamp = new Date().toISOString();
    const createdTickets: ServiceTicket[] = [];

    for (const ticketData of tickets) {
      const newTicket = await this.createTicket(ticketData);
      createdTickets.push(newTicket);
    }

    return createdTickets;
  }

  async analyzePriority(ticket: ServiceTicket): Promise<ServiceTicket> {
    // TODO: Implement AI analysis logic here
    const timestamp = new Date().toISOString();
    
    const aiAnalysis = {
      priorityScore: Math.random(), // Placeholder for actual AI scoring
      suggestedPriority: ticket.priority,
      confidenceScore: 0.85,
      factors: [
        {
          factor: "Customer SLA",
          impact: 0.8,
          description: "Premium customer with active SLA"
        }
      ],
      keywords: ["urgent", "critical", "immediate attention"],
      category: "Hardware Malfunction",
      estimatedResolutionTime: 4, // hours
      lastAnalyzed: timestamp
    };

    return this.updateTicket(ticket.id, ticket.customer.company, { aiAnalysis });
  }
}

// Create and export a singleton instance
export const fieldServiceManager = new FieldServiceManager();
