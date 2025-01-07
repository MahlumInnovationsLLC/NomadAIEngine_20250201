import { OpenAIClient } from "@azure/openai";
import { AzureKeyCredential } from "@azure/core-auth";

let client: OpenAIClient | null = null;
const deploymentName = "gpt-35-turbo"; // Update this with your actual deployment name

export function initializeOpenAI() {
  try {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      console.warn("Azure OpenAI credentials not configured. AI features will be disabled.");
      return;
    }

    client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY)
    );
  } catch (error) {
    console.error("Error initializing Azure OpenAI:", error);
    client = null;
  }
}

// Initialize on module load
initializeOpenAI();

export async function generateEmbeddings(text: string) {
  if (!client) {
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