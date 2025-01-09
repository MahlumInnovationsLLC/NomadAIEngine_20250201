import { CosmosClient, Container, Database } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';

let client: CosmosClient | null = null;
let database: Database | null = null;
let container: Container | null = null;

export async function initializeCosmosDB() {
  try {
    if (!process.env.AZURE_COSMOS_CONNECTION_STRING) {
      throw new Error("Azure Cosmos DB connection string not configured");
    }

    const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING.trim();

    if (!connectionString) {
      throw new Error("Azure Cosmos DB connection string is empty");
    }

    client = new CosmosClient(connectionString);

    // Create database if it doesn't exist
    const { database: db } = await client.databases.createIfNotExists({
      id: "GYMAIEngineDB"
    });
    database = db;
    console.log("Successfully connected to database:", db.id);

    // Create container if it doesn't exist with the specified partition key
    const { container: cont } = await database.containers.createIfNotExists({
      id: "chats",
      partitionKey: { paths: ["/userKey"] }
    });
    container = cont;
    console.log("Successfully created/connected to container:", cont.id);

    console.log("Successfully connected to Azure Cosmos DB");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    throw error;
  }
}

export async function checkContainerAvailability(): Promise<boolean> {
  try {
    if (!container) {
      await initializeCosmosDB();
    }

    if (!container) {
      return false;
    }

    // Try to read the container properties as a connection test
    await container.read();
    return true;
  } catch (error) {
    console.error("Error checking Cosmos DB connection:", error);
    return false;
  }
}

function ensureContainer() {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection.");
  }
  return container;
}

export async function createChat(chatData: any) {
  const cont = ensureContainer();

  try {
    // Generate a new UUID for the chat
    const chatId = uuidv4();

    // Ensure proper structure with required fields
    const chatWithMetadata = {
      id: chatId,
      userKey: chatData.userKey || 'user123', // Default userKey for demo
      title: chatData.content?.substring(0, 50) || "New Chat", // Use first message as title
      messages: [{
        id: uuidv4(),
        role: 'user',
        content: chatData.content,
        createdAt: new Date().toISOString()
      }],
      lastMessageAt: new Date().toISOString(),
      type: 'chat'
    };

    console.log("Creating new chat with metadata:", chatWithMetadata);

    const { resource } = await cont.items.create(chatWithMetadata);

    if (!resource) {
      throw new Error("Failed to create chat resource");
    }

    return resource;
  } catch (error) {
    console.error("Error in createChat:", error);
    throw error;
  }
}

export async function updateChat(chatId: string, updates: any) {
  const cont = ensureContainer();

  try {
    const { resource: existingChat } = await cont.item(chatId, updates.userKey || 'user123').read();

    if (!existingChat) {
      throw new Error("Chat not found");
    }

    // Ensure messages array exists and append new messages
    const updatedChat = {
      ...existingChat,
      messages: [...(existingChat.messages || []), ...updates.messages],
      lastMessageAt: new Date().toISOString()
    };

    const { resource } = await cont.item(chatId, updates.userKey || 'user123').replace(updatedChat);
    return resource;
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
}

export async function getChat(chatId: string, userKey: string = 'user123') {
  const cont = ensureContainer();

  try {
    const { resource: chat } = await cont.item(chatId, userKey).read();
    return chat;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    console.error("Error retrieving chat:", error);
    throw error;
  }
}

export async function deleteChat(chatId: string, userKey: string = 'user123') {
  const cont = ensureContainer();

  try {
    await cont.item(chatId, userKey).delete();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}

export async function listChats(userKey: string = 'user123') {
  const cont = ensureContainer();

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'chat' AND c.userKey = @userKey ORDER BY c.lastMessageAt DESC",
      parameters: [
        {
          name: "@userKey",
          value: userKey
        }
      ]
    };

    const { resources: chats } = await cont.items.query(querySpec).fetchAll();
    return chats;
  } catch (error) {
    console.error("Error listing chats:", error);
    throw error;
  }
}

// Initialize on module load
initializeCosmosDB().catch(console.error);