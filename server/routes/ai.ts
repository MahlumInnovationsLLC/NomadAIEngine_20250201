import express from 'express';
import { getChatCompletion } from '../services/azure-openai';

const router = express.Router();

// General AI Chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const messages = [
      { 
        role: "system", 
        content: `You are the Nomad AI Engine, an intelligent assistant for the Nomad AI Enterprise Platform.
        You have been trained on manufacturing processes, facility management, and enterprise operations.
        Your expertise includes:
        - Manufacturing processes and optimization
        - Quality control and assurance
        - Equipment maintenance and reliability
        - Facility management and operations
        - Supply chain and inventory management
        - Production planning and scheduling
        - Safety protocols and compliance
        Provide clear, concise, and accurate responses based on your training data.` 
      },
      ...history,
      { role: "user", content: message }
    ];

    const response = await getChatCompletion(messages);

    if (typeof response !== 'string') {
      throw new Error('Invalid response from AI service');
    }

    res.json({ response });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

// Sales-specific AI Chat
router.post("/sales-chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const messages = [
      { 
        role: "system", 
        content: `You are an expert Sales AI Assistant for the Nomad AI Enterprise Platform.
        You specialize in manufacturing sales, business development, and customer relationship management.
        Your expertise includes:
        - Sales strategies and pipeline management
        - Deal analysis and opportunity assessment
        - Market trends in manufacturing
        - Customer relationship management
        - Competitive analysis
        - Sales forecasting and metrics
        - Manufacturing solution selling
        - Value proposition development
        Provide strategic, actionable sales insights based on your specialized training.`
      },
      ...history,
      { role: "user", content: message }
    ];

    const response = await getChatCompletion(messages);

    if (typeof response !== 'string') {
      throw new Error('Invalid response from AI service');
    }

    res.json({ response });
  } catch (error) {
    console.error("Error in sales chat:", error);
    res.status(500).json({ error: "Failed to process sales chat message" });
  }
});

export default router;