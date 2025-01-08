import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";

let client: OpenAIClient | null = null;
const deploymentName = "gpt-35-turbo";

export async function initializeOpenAI() {
  try {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      console.warn("Azure OpenAI credentials not configured");
      return null;
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.trim();
    const apiKey = process.env.AZURE_OPENAI_API_KEY.trim();

    if (!endpoint || !apiKey) {
      console.warn("Azure OpenAI endpoint or API key is empty");
      return null;
    }

    client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    // Test the connection immediately
    const testResult = await client.getChatCompletions(deploymentName, [
      { role: "system", content: "Test connection" }
    ]);

    if (!testResult.choices || testResult.choices.length === 0) {
      console.warn("OpenAI connection test failed - invalid response");
      return null;
    }

    return client;
  } catch (error) {
    console.error("Error initializing Azure OpenAI:", error);
    return null;
  }
}

export async function checkOpenAIConnection() {
  try {
    if (!client) {
      client = await initializeOpenAI();
    }

    if (!client) {
      return {
        status: "error",
        message: "OpenAI client not initialized"
      };
    }

    return {
      status: "connected",
      message: "Connected to Azure OpenAI"
    };
  } catch (error) {
    console.error("Error checking OpenAI connection:", error);
    return {
      status: "error",
      message: "Failed to connect to OpenAI"
    };
  }
}

// Initialize on module load
initializeOpenAI();

export async function generateEmbeddings(text: string) {
  if (!client) {
    console.warn("OpenAI client not initialized");
    return null;
  }

  try {
    const result = await client.getEmbeddings(deploymentName, [text]);
    return result.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return null;
  }
}

export async function analyzeDocument(content: string) {
  if (!client) {
    console.warn("OpenAI client not initialized");
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
    console.warn("OpenAI client not initialized");
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