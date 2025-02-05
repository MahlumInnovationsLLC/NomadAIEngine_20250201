import { Router } from "express";
import { openai } from "../services/azure/openai_service";
import { deploymentName } from "../services/azure/openai_service";

const router = Router();

// Analyze deal potential using Azure OpenAI
router.post("/analyze-deal", async (req, res) => {
  try {
    const dealData = req.body;

    const response = await openai.getChatCompletions(deploymentName, [
      {
        role: "system",
        content: "You are an expert sales analyst. Analyze the deal data and provide insights including score, confidence, recommendations, next best actions, and risk factors. Return the analysis in JSON format."
      },
      {
        role: "user",
        content: JSON.stringify(dealData)
      }
    ]);

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    res.json(JSON.parse(content));
  } catch (error) {
    console.error("Error analyzing deal:", error);
    res.status(500).json({ error: "Failed to analyze deal" });
  }
});

// Get sales recommendations using Azure OpenAI
router.post("/sales-recommendations", async (req, res) => {
  try {
    const salesData = req.body;

    const response = await openai.getChatCompletions(deploymentName, [
      {
        role: "system",
        content: "As a sales strategy expert, analyze the sales data and provide strategic recommendations, priority actions, and potential opportunities. Return in JSON format."
      },
      {
        role: "user",
        content: JSON.stringify(salesData)
      }
    ]);

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    res.json(JSON.parse(content));
  } catch (error) {
    console.error("Error getting sales recommendations:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;