import express from 'express';
import { getChatCompletion } from '../services/azure-openai';
import { getWebSearchCompletion } from '../services/perplexity';
import { CosmosClient } from "@azure/cosmos";

const router = express.Router();
const client = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING || "");
const databaseId = "NomadAIEngineDB";
const containerId = "nomadaidatacontainer";

interface Document {
  id: string;
  title: string;
  source: string;
  content: string;
  type: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

async function getRelevantDocuments(content: string): Promise<Document[]> {
  try {
    const database = client.database(databaseId);
    const container = database.container(containerId);

    // Verify container exists and is accessible
    try {
      await container.read();
    } catch (error) {
      console.error('Container read error:', error);
      return [];
    }

    // Query all documents and filter by relevance
    const querySpec = {
      query: `
        SELECT c.id, c.title, c.source, c.content, c.type 
        FROM c 
        WHERE IS_DEFINED(c.title) 
        AND IS_DEFINED(c.content)
        AND IS_DEFINED(c.type)
      `
    };

    const { resources: documents } = await container.items
      .query<Document>(querySpec)
      .fetchAll();

    if (documents.length === 0) {
      console.warn('No documents found in container');
      return [];
    }

    // Filter documents based on content relevance
    const relevantDocs = documents.filter(doc => {
      const docContent = (doc.content || '').toLowerCase();
      const searchContent = content.toLowerCase();
      return docContent.includes(searchContent) || searchContent.includes(docContent);
    });

    console.log(`Found ${relevantDocs.length} relevant documents out of ${documents.length} total`);
    return relevantDocs;
  } catch (error) {
    console.error('Error in getRelevantDocuments:', error);
    return [];
  }
}

// General AI Chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const messages: Message[] = [
      { 
        role: "system", 
        content: `You are the Nomad AI Engine, an intelligent assistant for the Nomad AI Enterprise Platform.
        You have been trained on all manufacturing, operations, and facility management data available in our system.
        Your knowledge encompasses:
        - Manufacturing processes and standards
        - Quality control procedures and ISO standards
        - Equipment specifications and maintenance
        - Facility management protocols
        - Supply chain operations
        - Production planning
        - Safety and compliance documentation
        - Standard operating procedures
        Format responses with proper markdown for readability.
        When citing information, reference the specific document sources from our database.` 
      },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message }
    ];

    const response = await getChatCompletion(messages);
    const documents = await getRelevantDocuments(response);

    // Format the response with actual document citations
    const formattedResponse = documents.length > 0 
      ? `${response}\n\n---\n\n**Data Sources:**\n${documents.map((doc: Document, i: number) => 
          `* ${doc.title} (${doc.type}) [${i + 1}]`
        ).join('\n')}`
      : response;

    res.json({ response: formattedResponse });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ 
      error: "Failed to process chat message",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Web Search Chat using Perplexity
router.post("/web-search", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const messages: Message[] = [
      { 
        role: "system", 
        content: "You are a web search assistant focusing on manufacturing and industrial topics. Provide factual, up-to-date information based on web sources. Focus on manufacturing, industrial processes, facility management, and enterprise operations. Format your responses with proper markdown for readability. Use bullet points and sections where appropriate. Cite your sources when providing information."
      }
    ];

    // Process history to ensure alternating pattern
    if (history && Array.isArray(history)) {
      let lastRole: Message["role"] = "system";
      const validRoles: Message["role"][] = ["user", "assistant"];

      for (const msg of history) {
        if (!validRoles.includes(msg.role as Message["role"])) continue;

        if (
          (lastRole === "system" && msg.role === "user") ||
          (lastRole === "user" && msg.role === "assistant") ||
          (lastRole === "assistant" && msg.role === "user")
        ) {
          messages.push({ role: msg.role as Message["role"], content: msg.content });
          lastRole = msg.role as Message["role"];
        }
      }

      if (lastRole === "user") {
        messages.push({ 
          role: "assistant", 
          content: history[history.length - 1].content 
        });
        lastRole = "assistant";
      }
    }

    if (messages[messages.length - 1].role !== "user") {
      messages.push({ role: "user", content: message });
    }

    const { response, citations } = await getWebSearchCompletion(messages);

    // Format the response with better markdown and spacing
    const formattedResponse = Array.isArray(citations) && citations.length > 0
      ? `${response}\n\n---\n\n**Sources:**\n${citations.map((url: string, i: number) => 
          `* [${url}](${url}) [${i + 1}]`
        ).join('\n')}`
      : response;

    res.json({ response: formattedResponse });
  } catch (error) {
    console.error("Error in web search:", error);
    res.status(500).json({ 
      error: "Failed to process web search",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;