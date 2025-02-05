
import express from 'express';
import { getChatCompletion } from '../services/azure-openai';

const router = express.Router();

// Get sales recommendations
router.post("/sales-recommendations", async (req, res) => {
  try {
    const salesData = req.body;

    const prompt = `Analyze this sales data and provide strategic recommendations.
    Return your analysis in this exact JSON format:
    {
      "recommendations": string[],
      "priorityActions": string[],
      "opportunities": string[]
    }

    Sales data: ${JSON.stringify(salesData)}`;

    const response = await getChatCompletion([
      { role: "system", content: "You are a sales strategy expert for manufacturing solutions." },
      { role: "user", content: prompt }
    ]);

    // Parse and clean the JSON response
    const cleanedContent = response.replace(/```json\n?|\n?```/g, '').trim();
    res.json(JSON.parse(cleanedContent));
  } catch (error) {
    console.error("Error getting sales recommendations:", error);
    res.status(500).json({ error: "Failed to get sales recommendations" });
  }
});

// AI Sales Chat
router.post("/sales-chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    const messages = [
      { 
        role: "system", 
        content: "You are a helpful sales assistant for a manufacturing solutions company. Provide concise, relevant advice about sales strategies, deal analysis, and market insights." 
      },
      ...history,
      { role: "user", content: message }
    ];

    const response = await getChatCompletion(messages);
    res.json({ response });
  } catch (error) {
    console.error("Error in sales chat:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

// Analyze email sentiment
router.post("/analyze-email", async (req, res) => {
  try {
    const { content } = req.body;

    const prompt = `Analyze the sentiment of this email content and provide suggestions for improvement.
    Return results in this exact JSON format:
    {
      "sentiment": "positive" | "neutral" | "negative",
      "score": number,
      "suggestions": string[]
    }

    Email content: ${content}`;

    const response = await getChatCompletion([
      { role: "system", content: "You are an expert at analyzing business communication and sales emails." },
      { role: "user", content: prompt }
    ]);

    // Parse and clean the JSON response
    const cleanedContent = response.replace(/```json\n?|\n?```/g, '').trim();
    res.json(JSON.parse(cleanedContent));
  } catch (error) {
    console.error("Error analyzing email:", error);
    res.status(500).json({ error: "Failed to analyze email" });
  }
});

export default router;
