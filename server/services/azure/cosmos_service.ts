import { CosmosClient, Container, Database } from "@azure/cosmos";

let client: CosmosClient | null = null;
let database: Database | null = null;
let container: Container | null = null;

export async function initializeCosmosDB() {
  try {
    if (!process.env.AZURE_COSMOS_CONNECTION_STRING) {
      throw new Error("Azure Cosmos DB connection string not configured");
    }

    // Trim the connection string to remove any whitespace
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

// Helper function to check container availability
function ensureContainer() {
  if (!container) {
    throw new Error("Cosmos DB not initialized. Please check your connection.");
  }
  return container;
}

// Chat-specific operations
export async function createChat(chatData: any) {
  const cont = ensureContainer();

  try {
    console.log("Creating chat with data:", chatData); // Debug log

    // Validate required fields
    if (!chatData.id || !chatData.userKey || !chatData.messages) {
      throw new Error("Missing required fields in chat data");
    }

    // Add metadata fields and ensure proper structure
    const chatWithMetadata = {
      id: chatData.id,
      userKey: chatData.userKey,
      title: chatData.title || "",
      messages: Array.isArray(chatData.messages) ? chatData.messages : [],
      lastMessageAt: chatData.lastMessageAt || new Date().toISOString(),
      _ts: Math.floor(Date.now() / 1000),
      type: 'chat'
    };

    console.log("Attempting to create chat with metadata:", chatWithMetadata); // Debug log
    const { resource } = await cont.items.create(chatWithMetadata);

    if (!resource) {
      throw new Error("Failed to create chat resource");
    }

    console.log("Successfully created chat:", resource); // Debug log
    return resource;
  } catch (error: any) {
    console.error("Error in createChat:", error); // Debug log
    if (error.code === 409) {
      // If document already exists, try to get it
      const { resource: existingChat } = await cont.item(chatData.id, chatData.userKey).read();
      return existingChat;
    }
    throw error;
  }
}

export async function getChat(userId: string, chatId: string) {
  const cont = ensureContainer();

  try {
    const { resource: chat } = await cont.item(chatId, userId).read();

    // Initialize empty messages array if it doesn't exist
    if (chat && !Array.isArray(chat.messages)) {
      chat.messages = [];
    }

    return chat;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    console.error("Error retrieving chat:", error);
    throw error;
  }
}

export async function updateChat(userId: string, chatId: string, updates: any) {
  const cont = ensureContainer();

  try {
    const { resource: existingChat } = await cont.item(chatId, userId).read();

    if (!existingChat) {
      throw new Error("Chat not found");
    }

    // Ensure messages array exists in both objects
    const updatedChat = {
      ...existingChat,
      ...updates,
      messages: Array.isArray(updates.messages) ? updates.messages : (existingChat.messages || []),
      _ts: Math.floor(Date.now() / 1000),
      lastMessageAt: updates.lastMessageAt || new Date().toISOString()
    };

    const { resource: result } = await cont.item(chatId, userId).replace(updatedChat);
    return result;
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
}

export async function deleteChat(userId: string, chatId: string) {
  const cont = ensureContainer();

  try {
    await cont.item(chatId, userId).delete();
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
}

export async function listChats(userId: string) {
  const cont = ensureContainer();

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'chat' AND c.userKey = @userId ORDER BY c._ts DESC",
      parameters: [
        {
          name: "@userId",
          value: userId
        }
      ]
    };

    const { resources: chats } = await cont.items
      .query(querySpec)
      .fetchAll();

    // Ensure messages array exists for all chats
    return chats.map(chat => ({
      ...chat,
      messages: Array.isArray(chat.messages) ? chat.messages : []
    }));
  } catch (error) {
    console.error("Error listing chats:", error);
    throw error;
  }
}

// Initialize on module load
initializeCosmosDB().catch(console.error);