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

    try {
      client = new OpenAIClient(
        endpoint,
        new AzureKeyCredential(apiKey)
      );

      // Test connection with a simple request
      const testResult = await client.getChatCompletions(deploymentName, [
        { role: "system", content: "Test connection" },
        { role: "user", content: "Test message" }
      ], {
        maxRetries: 3,
        timeout: 10000
      });

      if (!testResult.choices || testResult.choices.length === 0) {
        console.warn("OpenAI connection test failed - AI features will be disabled");
        return null;
      }

      console.log("Successfully connected to Azure OpenAI");
      return client;
    } catch (error) {
      console.error("OpenAI deployment error:", error);
      return null;
    }
  } catch (error) {
    console.error("Error initializing Azure OpenAI:", error);
    return null;
  }
}

export async function checkOpenAIConnection() {
  try {
    if (!client) {
      await initializeOpenAI();
    }

    // If still no client after initialization attempt, return disabled status
    if (!client) {
      return [{
        name: "Azure OpenAI",
        status: "disabled",
        message: "Azure OpenAI not configured or failed to initialize"
      }];
    }

    try {
      const testResult = await client.getChatCompletions(deploymentName, [
        { role: "system", content: "Connection test" },
        { role: "user", content: "Test message" }
      ], {
        maxRetries: 3,
        timeout: 10000
      });

      return [{
        name: "Azure OpenAI",
        status: testResult.choices && testResult.choices.length > 0 ? "connected" : "error",
        message: testResult.choices && testResult.choices.length > 0 
          ? `Connected to Azure OpenAI (${deploymentName})`
          : "Failed to connect to OpenAI"
      }];
    } catch (error: any) {
      return [{
        name: "Azure OpenAI",
        status: "error",
        message: `Failed to connect to OpenAI: ${error.message || 'Unknown error'}`
      }];
    }
  } catch (error) {
    console.error("Error checking OpenAI status:", error);
    return [{
      name: "Azure OpenAI",
      status: "error",
      message: error instanceof Error ? error.message : "Failed to check OpenAI status"
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
    return "I apologize, but the AI service is currently unavailable. Please try again later.";
  }

  try {
    console.log("Generating report content with Azure OpenAI...");
    const result = await client.getChatCompletions(deploymentName, [
      { 
        role: "system", 
        content: `You are a helpful assistant for a Fitness Facility and Health Club. You are an expert in all things fitness and Health Club Management. You are also a professional report writer that creates detailed, well-structured reports with your fitness industry expertise.

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
    ], {
      maxRetries: 3,
      timeout: 30000
    });

    if (!result.choices || result.choices.length === 0) {
      console.warn("No response received from OpenAI");
      return "I apologize, but I wasn't able to generate a response. Please try again.";
    }

    console.log("Successfully generated report content");
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

export async function checkOpenAIConnection(){
    try{
        if(!client){
            await initializeOpenAI();
        }
        const services = [];
        try{
            if (!client) {
                services.push({
                  name: "Azure OpenAI",
                  status: "disabled",
                  message: "Azure OpenAI not configured"
                });
              } else {
                const testResult = await client.getChatCompletions(deploymentName, [
                  { role: "system", content: "Connection test" },
                  { role: "user", content: "Test message" }
                ], {
                  maxRetries: 3,
                  timeout: 10000
                });
        
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
    } catch (error){
        console.error("Error checking services status:", error);
        return [{
          name: "Azure Services",
          status: "error",
          message: error instanceof Error ? error.message : "Failed to check services status"
        }];
    }
}