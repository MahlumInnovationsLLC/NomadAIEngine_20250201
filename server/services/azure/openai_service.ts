import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";
import { checkContainerAvailability } from "./cosmos_service";
import { checkBlobStorageConnection } from "./blob_service";

let client: OpenAIClient | null = null;
const deploymentName = process.env.AZURE_OPENAI_MODEL || "GYMAIEngine-gpt-4o";
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024

export async function initializeOpenAI() {
  try {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      console.warn("Azure OpenAI credentials not configured - AI features will be disabled");
      return null;
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.trim();
    const apiKey = process.env.AZURE_OPENAI_API_KEY.trim();

    if (!endpoint || !apiKey) {
      console.warn("Azure OpenAI endpoint or API key is empty - AI features will be disabled");
      return null;
    }

    console.log(`Attempting to initialize Azure OpenAI with deployment: ${deploymentName}`);

    client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    // Optional connection test
    try {
      const testResult = await client.getChatCompletions(deploymentName, [
        { role: "system", content: "Test connection" }
      ]);

      if (!testResult.choices || testResult.choices.length === 0) {
        console.warn("OpenAI connection test failed - AI features will be disabled");
        return null;
      }

      console.log("Successfully connected to Azure OpenAI");
      return client;
    } catch (error) {
      console.warn("OpenAI deployment not found or not ready - AI features will be disabled:", error);
      return null;
    }
  } catch (error) {
    console.warn("Error initializing Azure OpenAI - AI features will be disabled:", error);
    return null;
  }
}

export async function checkOpenAIConnection() {
  try {
    if (!client) {
      await initializeOpenAI();
    }

    const services = [];

    // Check OpenAI Connection
    try {
      if (!client) {
        services.push({
          name: "Azure OpenAI",
          status: "disabled",
          message: "Azure OpenAI not configured"
        });
      } else {
        const testResult = await client.getChatCompletions(deploymentName, [
          { role: "system", content: "Connection test" }
        ]);

        services.push({
          name: "Azure OpenAI",
          status: testResult.choices && testResult.choices.length > 0 ? "connected" : "error",
          message: testResult.choices && testResult.choices.length > 0 
            ? `Connected to Azure OpenAI (${deploymentName})`
            : "Failed to connect to OpenAI"
        });
      }
    } catch (error: any) {
      services.push({
        name: "Azure OpenAI",
        status: "error",
        message: `Failed to connect to OpenAI: ${error.message || 'Unknown error'}`
      });
    }

    // Check Cosmos DB Connection
    try {
      const cosmosStatus = await checkContainerAvailability();
      services.push({
        name: "Azure Cosmos DB",
        status: cosmosStatus ? "connected" : "error",
        message: cosmosStatus ? "Connected to Cosmos DB" : "Failed to connect to Cosmos DB"
      });
    } catch (error: any) {
      services.push({
        name: "Azure Cosmos DB",
        status: "error",
        message: `Failed to connect to Cosmos DB: ${error.message || 'Unknown error'}`
      });
    }

    // Check Blob Storage Connection
    try {
      const blobStatus = await checkBlobStorageConnection();
      services.push({
        name: "Azure Blob Storage",
        status: blobStatus ? "connected" : "error",
        message: blobStatus ? "Connected to Blob Storage" : "Failed to connect to Blob Storage"
      });
    } catch (error: any) {
      services.push({
        name: "Azure Blob Storage",
        status: "error",
        message: `Failed to connect to Blob Storage: ${error.message || 'Unknown error'}`
      });
    }

    return services;
  } catch (error) {
    console.error("Error checking services status:", error);
    return [{
      name: "Azure Services",
      status: "error",
      message: error instanceof Error ? error.message : "Failed to check services status"
    }];
  }
}

export async function ensureInitialized() {
  if (!client) {
    client = await initializeOpenAI();
  }
  return client;
}

export async function generateEmbeddings(text: string) {
  await ensureInitialized();
  if (!client) {
    console.warn("OpenAI client not initialized - embeddings generation skipped");
    return null;
  }

  try {
    const result = await client.getEmbeddings(deploymentName, [text]);
    return result.data[0].embedding;
  } catch (error) {
    console.warn("Error generating embeddings:", error);
    return null;
  }
}

export async function analyzeDocument(content: string) {
  await ensureInitialized();
  if (!client) {
    console.warn("OpenAI client not initialized - chat completion skipped");
    return "I apologize, but the AI service is currently unavailable. Please try again later.";
  }

  try {
    const result = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "You are a helpful AI assistant specialized in document management and training. Help the user with their questions and provide detailed, relevant responses." },
      { role: "user", content }
    ]);

    if (!result.choices || result.choices.length === 0) {
      console.warn("No response received from OpenAI");
      return "I apologize, but I wasn't able to generate a response. Please try again.";
    }

    return result.choices[0].message?.content || "I apologize, but I wasn't able to understand your request.";
  } catch (error) {
    console.error("Error in analyzeDocument:", error);
    return "I apologize, but I'm having trouble processing your request. Please try again later.";
  }
}

export async function generateSummary(content: string) {
  await ensureInitialized();
  if (!client) {
    console.warn("OpenAI client not initialized - summary generation skipped");
    return null;
  }

  try {
    const result = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "You are an AI assistant that summarizes documents." },
      { role: "user", content: `Please summarize this document: ${content}` }
    ]);
    return result.choices[0].message?.content;
  } catch (error) {
    console.warn("Error generating summary:", error);
    return null;
  }
}