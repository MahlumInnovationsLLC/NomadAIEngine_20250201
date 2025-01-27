import { CosmosClient, Container, Database } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';

let client: CosmosClient | null = null;
export let database: Database | null = null;
let containers: Record<string, Container> = {};
let isInitialized = false;

export async function initializeCosmosDB() {
  try {
    if (isInitialized) {
      console.log("Cosmos DB already initialized");
      return;
    }

    if (!process.env.AZURE_COSMOS_CONNECTION_STRING) {
      throw new Error("Azure Cosmos DB connection string not configured");
    }

    const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING.trim();

    if (!connectionString) {
      throw new Error("Azure Cosmos DB connection string is empty");
    }

    console.log("Creating Cosmos DB client...");
    client = new CosmosClient(connectionString);

    // Create database if it doesn't exist
    console.log("Creating/getting database...");
    const { database: db } = await client.databases.createIfNotExists({
      id: "GYMAIEngineDB"
    });
    database = db;

    // Create containers if they don't exist
    const containerConfigs = [
      { id: "chats", partitionKey: "/userKey" },
      { id: "equipment", partitionKey: "/id" },
      { id: "equipment-types", partitionKey: "/id" },
      { id: "building-systems", partitionKey: "/id" },
      { id: "facility-maintenance", partitionKey: "/id" },
      { id: "pool-maintenance", partitionKey: "/id" },
      { id: "inspections", partitionKey: "/id" }
    ];

    console.log("Creating/getting containers...");
    await Promise.all(
      containerConfigs.map(async (config) => {
        console.log(`Creating/getting container: ${config.id}`);
        const { container } = await database!.containers.createIfNotExists({
          id: config.id,
          partitionKey: { paths: [config.partitionKey] }
        });
        containers[config.id] = container;
      })
    );

    isInitialized = true;
    console.log("Successfully connected to Azure Cosmos DB and initialized containers");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    throw error;
  }
}

// Export functions to get specific containers
export function getContainer(containerId: string): Container | null {
  if (!isInitialized) {
    console.warn(`Cosmos DB not initialized when requesting container: ${containerId}`);
    return null;
  }
  return containers[containerId] || null;
}

function ensureContainer(containerId: string) {
  const container = getContainer(containerId);
  if (!container) {
    throw new Error(`Cosmos DB container '${containerId}' not initialized. Please check your connection.`);
  }
  return container;
}

export const cosmosContainer = {
  get items() {
    return getContainer('building-systems')?.items;
  },
  item(id: string, partitionKey: string) {
    return getContainer('building-systems')?.item(id, partitionKey);
  }
};

// Export function to check initialization status
export function isCosmosInitialized() {
  return isInitialized;
}

// Export function to wait for initialization
export async function waitForCosmosInitialization(timeoutMs = 30000) {
  const startTime = Date.now();
  while (!isInitialized && Date.now() - startTime < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!isInitialized) {
    throw new Error("Timed out waiting for Cosmos DB initialization");
  }
}

// Export function to create chat
export async function createChat(chatData: any) {
  const cont = ensureContainer('building-systems');

  try {
    // Generate a unique chat ID using UUID with timestamp to avoid conflicts
    const chatId = `chat_${Date.now()}_${uuidv4()}`;

    // Initial message from the user
    const firstMessage = {
      id: uuidv4(),
      role: 'user',
      content: chatData.content,
      createdAt: new Date().toISOString()
    };

    // Construct chat document with metadata
    const chatDocument = {
      id: chatId,
      userKey: chatData.userKey || 'default_user', // Using a default user key
      title: chatData.content?.substring(0, 50) || "New Chat",
      messages: [firstMessage],
      lastMessageAt: new Date().toISOString(),
      type: 'chat',
      isDeleted: false
    };

    console.log("Creating new chat:", chatDocument);

    const { resource } = await cont.items.create(chatDocument);

    if (!resource) {
      throw new Error("Failed to create chat resource");
    }

    return resource;
  } catch (error) {
    console.error("Error in createChat:", error);
    throw error;
  }
}

// Export function to update chat
export async function updateChat(chatId: string, updates: any) {
  const cont = ensureContainer('building-systems');

  try {
    const { resource: existingChat } = await cont.item(chatId, updates.userKey || 'default_user').read();

    if (!existingChat || existingChat.isDeleted) {
      throw new Error("Chat not found or has been deleted");
    }

    const newMessage = {
      id: uuidv4(),
      role: updates.role || 'user',
      content: updates.content,
      createdAt: new Date().toISOString()
    };

    const updatedChat = {
      ...existingChat,
      messages: [...existingChat.messages, newMessage],
      lastMessageAt: new Date().toISOString()
    };

    const { resource } = await cont.item(chatId, updates.userKey || 'default_user').replace(updatedChat);
    return resource;
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
}

// Export function to delete chat
export async function deleteChat(chatId: string, userKey: string = 'default_user') {
  const cont = ensureContainer('building-systems');

  try {
    // Soft delete by marking the chat as deleted
    const { resource: chat } = await cont.item(chatId, userKey).read();

    if (!chat || chat.isDeleted) {
      throw new Error("Chat not found or already deleted");
    }

    const updatedChat = {
      ...chat,
      isDeleted: true,
      deletedAt: new Date().toISOString()
    };

    await cont.item(chatId, userKey).replace(updatedChat);
    return { success: true };
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}

// Export function to list chats
export async function listChats(userKey: string = 'default_user') {
  const cont = ensureContainer('building-systems');

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'chat' AND c.userKey = @userKey AND (NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false) ORDER BY c.lastMessageAt DESC",
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