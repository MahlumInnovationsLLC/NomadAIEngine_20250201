
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
    return "I apologize, but the AI service is currently unavailable. Please ensure Azure OpenAI credentials are configured.";
  }

  try {
    const result = await client.getChatCompletions(
      deploymentName,
      messages,
      {
        temperature: 0.7,
        maxTokens: 800,
      }
    );

    return result.choices[0].message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error("Azure OpenAI Error:", error);
    throw new Error("Failed to get response from AI model");
  }
}
