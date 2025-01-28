import { CosmosClient, Container, Database } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';

let client: CosmosClient | null = null;
export let database: Database | null = null;
export let containers: Record<string, Container> = {};

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

    // Create containers if they don't exist
    const containerConfigs = [
      { id: "chats", partitionKey: "/userKey" },
      { id: "equipment", partitionKey: "/id" },
      { id: "equipment-types", partitionKey: "/id" },
      { id: "building-systems", partitionKey: "/id" }
    ];

    await Promise.all(
      containerConfigs.map(async (config) => {
        const { container } = await database!.containers.createIfNotExists({
          id: config.id,
          partitionKey: { paths: [config.partitionKey] }
        });
        containers[config.id] = container;
      })
    );

    console.log("Successfully connected to Azure Cosmos DB and initialized containers");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    throw error;
  }
}

// Get container helper function
export function getContainer(containerId: string): Container | null {
  return containers[containerId] || null;
}

// Export container access object
export const cosmosContainer = {
  get items() {
    return getContainer('building-systems')?.items;
  },
  item(id: string, partitionKey: string) {
    return getContainer('building-systems')?.item(id, partitionKey);
  }
};

// Initialize on module load
initializeCosmosDB().catch(console.error);

// Export functions to get specific containers

function ensureContainer(containerId: string) {
  const container = getContainer(containerId);
  if (!container) {
    throw new Error(`Cosmos DB container '${containerId}' not initialized. Please check your connection.`);
  }
  return container;
}


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