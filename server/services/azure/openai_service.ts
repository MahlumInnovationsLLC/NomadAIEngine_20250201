import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";
import OpenAI from "openai";

let client: OpenAIClient | null = null;
const deploymentName = "gpt-35-turbo"; // Update this with your actual deployment name

// Initialize OpenAI API client for more advanced features
export const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/`,
  defaultQuery: { "api-version": "2024-02-15-preview" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY }
});

export function initializeOpenAI() {
  try {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      console.warn("Azure OpenAI credentials not configured. AI features will be disabled.");
      return;
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.trim();
    const apiKey = process.env.AZURE_OPENAI_API_KEY.trim();

    if (!endpoint || !apiKey) {
      console.warn("Azure OpenAI endpoint or API key is empty. AI features will be disabled.");
      return;
    }

    console.log("Attempting to connect to Azure OpenAI...");
    client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );
    console.log("Successfully initialized Azure OpenAI client");
  } catch (error) {
    console.error("Error initializing Azure OpenAI:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    client = null;
  }
}

export async function checkOpenAIConnection() {
  try {
    if (!client) {
      return {
        status: "error",
        message: "OpenAI client not initialized"
      };
    }

    // Test the connection by making a simple completion request
    const result = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello" }
    ]);

    if (result.choices && result.choices.length > 0) {
      return {
        status: "connected",
        message: "Service is operational"
      };
    } else {
      throw new Error("Invalid response from OpenAI");
    }
  } catch (error) {
    console.error("Error checking OpenAI connection:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to connect to OpenAI"
    };
  }
}

// Initialize on module load
initializeOpenAI();

export async function generateEmbeddings(text: string) {
  if (!client) {
    console.warn("OpenAI client not initialized. Skipping embedding generation.");
    return null;
  }

  try {
    const result = await client.getEmbeddings(deploymentName, [text]);
    return result.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name
      });
    }
    return null;
  }
}

export async function analyzeDocument(content: string) {
  if (!client) {
    console.warn("OpenAI client not initialized. Skipping document analysis.");
    return null;
  }

  try {
    const result = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "You are an AI assistant that helps analyze documents." },
      { role: "user", content: `Please analyze this document: ${content}` }
    ]);
    return result.choices[0].message?.content;
  } catch (error) {
    console.error("Error analyzing document:", error);
    return null;
  }
}

export async function generateSummary(content: string) {
  if (!client) {
    console.warn("OpenAI client not initialized. Skipping summary generation.");
    return null;
  }

  try {
    const result = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "You are an AI assistant that summarizes documents." },
      { role: "user", content: `Please summarize this document: ${content}` }
    ]);
    return result.choices[0].message?.content;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}