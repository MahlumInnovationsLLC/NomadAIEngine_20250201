import { Router } from 'express';
import { OpenAI } from 'openai';
import { container } from '../../../cosmosdb';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get audit trends data
router.get('/trends', async (req, res) => {
  try {
    const { resources: audits } = await container.items
      .query("SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.createdAt DESC")
      .fetchAll();

    // Process audits to generate trend data
    const trendData = processAuditTrends(audits);
    res.json(trendData);
  } catch (error) {
    console.error('Error fetching audit trends:', error);
    res.status(500).json({ error: 'Failed to fetch audit trends' });
  }
});

// Get AI-generated insights
router.get('/insights', async (req, res) => {
  try {
    const { resources: audits } = await container.items
      .query("SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.createdAt DESC")
      .fetchAll();

    const insights = await generateAIInsights(audits);
    res.json(insights);
  } catch (error) {
    console.error('Error generating audit insights:', error);
    res.status(500).json({ error: 'Failed to generate audit insights' });
  }
});

// Helper function to process audit trends
function processAuditTrends(audits) {
  const monthlyData = {};
  
  audits.forEach(audit => {
    const date = new Date(audit.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        observations: 0,
        minorNonConformities: 0,
        majorNonConformities: 0,
        opportunities: 0
      };
    }
    
    // Count findings by type
    audit.findings?.forEach(finding => {
      switch (finding.type) {
        case 'observation':
          monthlyData[monthKey].observations++;
          break;
        case 'minor':
          monthlyData[monthKey].minorNonConformities++;
          break;
        case 'major':
          monthlyData[monthKey].majorNonConformities++;
          break;
        case 'opportunity':
          monthlyData[monthKey].opportunities++;
          break;
      }
    });
  });
  
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

// Helper function to generate AI insights using OpenAI
async function generateAIInsights(audits) {
  // Prepare audit data for analysis
  const auditSummary = audits.map(audit => ({
    date: audit.createdAt,
    type: audit.type,
    standard: audit.standard,
    findings: audit.findings,
    status: audit.status
  }));

  // Generate insights using OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // newest OpenAI model released May 13, 2024
    messages: [
      {
        role: "system",
        content: "You are an expert quality auditor. Analyze the audit data and provide insights in JSON format with categories: trends, risks, and improvements."
      },
      {
        role: "user",
        content: JSON.stringify(auditSummary)
      }
    ],
    response_format: { type: "json_object" }
  });

  // Parse and structure the insights
  const aiResponse = JSON.parse(response.choices[0].message.content);
  
  // Transform insights into structured format
  return Object.entries(aiResponse).flatMap(([category, items]) =>
    items.map((item, index) => ({
      id: `${category}-${index}`,
      category,
      title: item.title,
      description: item.description,
      confidence: item.confidence || 0.8,
      recommendation: item.recommendation,
      relatedFindings: item.relatedFindings || [],
      timestamp: new Date().toISOString()
    }))
  );
}

export default router;
