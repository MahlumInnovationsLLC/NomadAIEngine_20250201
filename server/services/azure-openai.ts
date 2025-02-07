import { AzureKeyCredential, OpenAIClient } from "@azure/openai";

const apiKey = process.env["NOMAD_AZURE_OPENAI_API_KEY"];
const endpoint = process.env["NOMAD_AZURE_OPENAI_ENDPOINT"];
const deploymentName = process.env["NOMAD_AZURE_OPENAI_MODEL"] || "NomadAIEngine-gpt-4o";

let client: OpenAIClient | null = null;

if (apiKey?.trim() && endpoint?.trim()) {
  client = new OpenAIClient(endpoint.trim(), new AzureKeyCredential(apiKey.trim()));
}

export async function getChatCompletion(messages: Array<{ role: string; content: string }>) {
  if (!client) {
    throw new Error("Azure OpenAI client not initialized");
  }

  try {
    const result = await client.getChatCompletions(
      deploymentName,
      messages,
      {
        temperature: 0.7,
        maxTokens: 2000, // Increased from 800 to 2000 to match Perplexity
      }
    );

    if (!result?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response structure from OpenAI");
    }

    return result.choices[0].message.content;
  } catch (error) {
    console.error("Azure OpenAI Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get response from AI model");
  }
}