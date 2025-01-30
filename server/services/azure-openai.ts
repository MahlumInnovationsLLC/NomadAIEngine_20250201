import { AzureKeyCredential, OpenAIClient } from "@azure/openai";

if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
  throw new Error("Azure OpenAI credentials not configured");
}

const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY)
);

export async function getChatCompletion(messages: Array<{ role: string; content: string }>) {
  try {
    const result = await client.getChatCompletions(
      "NomadAIEngine-gpt-4o", 
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