import express from 'express';
import { getChatCompletion } from '../services/azure-openai';

const router = express.Router();

// AI Chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const messages = [
      { 
        role: "system", 
        content: `You are the Nomad AI Engine, an intelligent assistant for the Nomad AI Enterprise Platform.
        You have been trained on manufacturing processes, facility management, and enterprise operations.
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

export default router;