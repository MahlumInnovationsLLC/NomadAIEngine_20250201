\n?|\n?```/g, '').trim();
    res.json(JSON.parse(cleanedContent));
  } catch (error) {
    console.error("Error analyzing deal:", error);
    res.status(500).json({ error: "Failed to analyze deal" });
  }
});

// Get sales recommendations
router.post("/sales-recommendations", async (req, res) => {
  try {
    const salesData = req.body;
    const openai = await initializeOpenAI();
    if (!openai) {
      throw new Error("OpenAI service not initialized");
    }

    const response = await openai.getChatCompletions(deploymentName, [
      {
        role: "system",
        content: `You are a sales strategy expert for manufacturing solutions.
        Analyze the sales data and provide strategic recommendations.
        Return your analysis in this exact JSON format:
        {
          "recommendations": string[],
          "priorityActions": string[],
          "opportunities": string[]
        }`
      },
      {
        role: "user",
        content: JSON.stringify(salesData)
      }
    ]);

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // Clean and parse JSON response
    const cleanedContent = content.replace(/```json\n?|\n?