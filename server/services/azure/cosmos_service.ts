import { CosmosClient, Container, Database } from "@azure/cosmos";

let client: CosmosClient | null = null;
let database: Database | null = null;
let container: Container | null = null;

export async function initializeCosmosDB() {
  try {
    if (!process.env.AZURE_COSMOS_CONNECTION_STRING) {
      console.warn("Azure Cosmos DB connection string not configured. Document storage will use local database.");
      return;
    }

    client = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING);
    database = client.database("documents-db");
    container = database.container("documents");

    // Verify connection
    await container.read();
    console.log("Successfully connected to Azure Cosmos DB");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    client = null;
    database = null;
    container = null;
  }
}

// Initialize on module load
initializeCosmosDB().catch(console.error);

export async function storeDocument(document: any) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resource: createdDocument } = await container.items.create(document);
    return createdDocument;
  } catch (error) {
    console.error("Error storing document in Cosmos DB:", error);
    throw error;
  }
}

export async function getDocument(id: string) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resource: document } = await container.item(id).read();
    return document;
  } catch (error) {
    if ((error as any).code === 404) {
      return null;
    }
    console.error("Error retrieving document from Cosmos DB:", error);
    throw error;
  }
}

export async function updateDocument(id: string, document: any) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resource: updatedDocument } = await container.item(id).replace(document);
    return updatedDocument;
  } catch (error) {
    console.error("Error updating document in Cosmos DB:", error);
    throw error;
  }
}

export async function listDocuments(querySpec: any) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resources: documents } = await container.items
      .query(querySpec)
      .fetchAll();
    return documents;
  } catch (error) {
    console.error("Error listing documents from Cosmos DB:", error);
    throw error;
  }
}