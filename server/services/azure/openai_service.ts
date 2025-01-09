import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";
import { db } from "@db";
import { checkContainerAvailability } from "./cosmos_service";
import { checkBlobStorageConnection } from "./blob_service";

let client: OpenAIClient | null = null;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "GYMAIEngine-gpt-4o";

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
            ? "Connected to Azure OpenAI"
            : "Failed to connect to OpenAI"
        });
      }
    } catch (error) {
      console.error("OpenAI Connection Error:", error);
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
    } catch (error) {
      services.push({
        name: "Azure Cosmos DB",
        status: "error",
        message: "Failed to connect to Cosmos DB"
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
    } catch (error) {
      services.push({
        name: "Azure Blob Storage",
        status: "error",
        message: "Failed to connect to Blob Storage"
      });
    }

    return services;
  } catch (error) {
    return [{
      name: "Azure Services",
      status: "error",
      message: "Failed to check services status"
    }];
  }
}

// Don't initialize on module load, let the application decide when to initialize
// This prevents blocking app startup
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
    console.warn("OpenAI client not initialized - document analysis skipped");
    return null;
  }

  try {
    const result = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "You are an AI assistant that helps analyze documents." },
      { role: "user", content: `Please analyze this document: ${content}` }
    ]);
    return result.choices[0].message?.content;
  } catch (error) {
    console.warn("Error analyzing document:", error);
    return null;
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