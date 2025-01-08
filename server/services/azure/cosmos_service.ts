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

    // Trim the connection string to remove any whitespace
    const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING.trim();

    if (!connectionString) {
      console.warn("Azure Cosmos DB connection string is empty. Document storage will use local database.");
      return;
    }

    client = new CosmosClient(connectionString);

    // Create database if it doesn't exist
    const { database: db } = await client.databases.createIfNotExists({
      id: "GYMAIEngineDB"
    });
    database = db;

    // Create container if it doesn't exist with the specified partition key
    const { container: cont } = await database.containers.createIfNotExists({
      id: "chats",
      partitionKey: "/userKey"
    });
    container = cont;

    console.log("Successfully connected to Azure Cosmos DB");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    client = null;
    database = null;
    container = null;
  }
}

// Initialize on module load
initializeCosmosDB().catch(console.error);

// Chat-specific operations
export async function createChat(chatData: any) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resource: createdChat } = await container.items.create({
      ...chatData,
      type: 'chat', // Add a type identifier
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return createdChat;
  } catch (error) {
    console.error("Error creating chat in Cosmos DB:", error);
    throw error;
  }
}

export async function getChat(userId: string, chatId: string) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resource: chat } = await container.item(chatId, userId).read();
    return chat;
  } catch (error) {
    if ((error as any).code === 404) {
      return null;
    }
    console.error("Error retrieving chat from Cosmos DB:", error);
    throw error;
  }
}

export async function updateChat(userId: string, chatId: string, updates: any) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const { resource: existingChat } = await container.item(chatId, userId).read();
    const updatedChat = {
      ...existingChat,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const { resource: result } = await container.item(chatId, userId).replace(updatedChat);
    return result;
  } catch (error) {
    console.error("Error updating chat in Cosmos DB:", error);
    throw error;
  }
}

export async function deleteChat(userId: string, chatId: string) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    await container.item(chatId, userId).delete();
  } catch (error) {
    console.error("Error deleting chat from Cosmos DB:", error);
    throw error;
  }
}

export async function listChats(userId: string) {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection string.");
  }

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'chat' AND c.userKey = @userId ORDER BY c.updatedAt DESC",
      parameters: [
        {
          name: "@userId",
          value: userId
        }
      ]
    };

    const { resources: chats } = await container.items
      .query(querySpec)
      .fetchAll();
    return chats;
  } catch (error) {
    console.error("Error listing chats from Cosmos DB:", error);
    throw error;
  }
}