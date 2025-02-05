import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";
import { getContainer } from "./cosmos_service";
import { getBlobServiceClient } from "./blob_service";

let client: OpenAIClient | null = null;
export const deploymentName = process.env.NOMAD_AZURE_OPENAI_MODEL || "NomadAIEngine-gpt-4o";

export async function initializeOpenAI() {
  try {
    // Don't reinitialize if we already have a client
    if (client) {
      return client;
    }

    // Validate environment variables
    if (!process.env.NOMAD_AZURE_OPENAI_ENDPOINT?.trim() || !process.env.NOMAD_AZURE_OPENAI_API_KEY?.trim()) {
      console.warn("Azure OpenAI credentials not configured or empty");
      return null;
    }

    const endpoint = process.env.NOMAD_AZURE_OPENAI_ENDPOINT.trim();
    const apiKey = process.env.NOMAD_AZURE_OPENAI_API_KEY.trim();

    console.log("Creating OpenAI client...");
    client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

    console.log("Testing OpenAI connection...");
    const testResult = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "Test" }
    ]);

    if (!testResult?.choices?.[0]?.message?.content) {
      console.warn("OpenAI connection test failed - invalid response");
      client = null;
      return null;
    }

    console.log("Successfully connected to Azure OpenAI");
    return client;
  } catch (error) {
    console.error("Error initializing Azure OpenAI:", error);
    client = null;
    return null;
  }
}

export async function ensureInitialized() {
  if (!client) {
    return initializeOpenAI();
  }
  return client;
}

export { client as openai };

export async function analyzeDocument(content: string) {
  const openai = await ensureInitialized();
  if (!openai) {
    return "I apologize, but the AI service is currently unavailable. Please try again later.";
  }

  try {
    console.log("Generating content with Azure OpenAI...");
    const result = await openai.getChatCompletions(deploymentName, [
      { 
        role: "system", 
        content: `You are a helpful assistant for a Vehicle Manufacturing Facility. You are an expert in manufacturing processes, production optimization, and quality control. You are also a professional report writer that creates detailed, well-structured reports with your manufacturing industry expertise.

When asked to generate a report, structure your response in the following format:

# [Create a clear, professional title for the report]

## Executive Summary
[Provide a concise summary of the key points]

## Detailed Analysis
[Provide thorough analysis with supporting evidence]

### Key Findings
[List and explain major findings]

### Impact Assessment
[Analyze potential impacts]

## Recommendations
[Provide actionable recommendations]

## Implementation Strategy
[Outline implementation steps]

Note: Use proper markdown formatting:
- Use # for main headings
- Use ## for subheadings
- Use ### for sub-subheadings
- Use bullet points (-)
- Use numbering (1., 2., etc.)
- Use **bold** for emphasis`
      },
      { role: "user", content }
    ]);

    if (!result?.choices?.[0]?.message?.content) {
      console.warn("No valid response received from OpenAI");
      return "I apologize, but I wasn't able to generate a response. Please try again.";
    }

    console.log("Successfully generated content");
    return result.choices[0].message.content;
  } catch (error) {
    console.error("Error in analyzeDocument:", error);
    return "I apologize, but I'm having trouble processing your request. Please try again later.";
  }
}

export async function generateSummary(content: string) {
  const openai = await ensureInitialized();
  if (!openai) {
    console.warn("OpenAI client not initialized - summary generation skipped");
    return null;
  }

  try {
    const result = await openai.getChatCompletions(deploymentName, [
      { role: "system", content: "You are an AI assistant that summarizes manufacturing documents." },
      { role: "user", content: `Please summarize this document: ${content}` }
    ]);

    return result?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn("Error generating summary:", error);
    return null;
  }
}

export async function predictMaintenanceNeeds(systemData: any) {
  const openai = await ensureInitialized();
  if (!openai) {
    return "AI service unavailable for maintenance prediction";
  }

  try {
    console.log("Generating maintenance prediction for system:", systemData.name);
    const result = await openai.getChatCompletions(deploymentName, [
      {
        role: "system",
        content: `You are an expert manufacturing maintenance AI assistant specializing in predictive maintenance for production systems. Analyze the provided system data and generate maintenance predictions and recommendations.

Format your response as a JSON object with the following structure:
{
  "nextMaintenanceDate": "YYYY-MM-DD",
  "predictedIssues": ["issue1", "issue2"],
  "maintenanceRecommendations": ["recommendation1", "recommendation2"],
  "urgencyLevel": "low|medium|high",
  "estimatedMaintenanceCost": number,
  "confidenceScore": number (0-1)
}`
      },
      {
        role: "user",
        content: JSON.stringify(systemData)
      }
    ]);

    if (!result?.choices?.[0]?.message?.content) {
      throw new Error("No prediction generated");
    }

    const prediction = JSON.parse(result.choices[0].message.content);
    return prediction;
  } catch (error) {
    console.error("Error generating maintenance prediction:", error);
    return null;
  }
}

async function checkBlobStorageConnection(): Promise<boolean> {
  try {
    const blobServiceClient = await getBlobServiceClient();
    if (!blobServiceClient) return false;

    // List containers to verify connection
    const containers = blobServiceClient.listContainers();
    await containers.next();
    return true;
  } catch (error) {
    console.error("Error checking blob storage connection:", error);
    return false;
  }
}

export async function checkOpenAIConnection() {
  try {
    const services = [];

    // Check OpenAI Connection
    try {
      const openaiClient = await ensureInitialized();
      if (!openaiClient) {
        services.push({
          name: "Azure OpenAI",
          status: "disabled",
          message: "Azure OpenAI not configured or failed to initialize"
        });
      } else {
        services.push({
          name: "Azure OpenAI",
          status: "connected",
          message: `Connected to Azure OpenAI (${deploymentName})`
        });
      }
    } catch (error: any) {
      services.push({
        name: "Azure OpenAI",
        status: "error",
        message: `Failed to connect to OpenAI: ${error.message || 'Unknown error'}`
      });
    }

    // Check Cosmos DB connection
    try {
      const container = getContainer('building-systems');
      if (!container) {
        services.push({
          name: "Azure Cosmos DB",
          status: "error",
          message: "Failed to connect to Cosmos DB"
        });
      } else {
        await container.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll();
        services.push({
          name: "Azure Cosmos DB",
          status: "connected",
          message: "Connected to Cosmos DB"
        });
      }
    } catch (error: any) {
      services.push({
        name: "Azure Cosmos DB",
        status: "error",
        message: `Failed to connect to Cosmos DB: ${error.message || 'Unknown error'}`
      });
    }

    // Check Blob Storage
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

async function checkBlobStorageStatus() {
  try {
    const blobStatus = await checkBlobStorageConnection();
    return {
      name: "Azure Blob Storage",
      status: blobStatus ? "connected" : "error",
      message: blobStatus ? "Connected to Blob Storage" : "Failed to connect to Blob Storage"
    };
  } catch (error: any) {
    return {
      name: "Azure Blob Storage",
      status: "error",
      message: `Failed to connect to Blob Storage: ${error.message || 'Unknown error'}`
    };
  }
}