import { Router } from 'express';
import { OpenAI } from 'openai';
import { CosmosClient } from '@azure/cosmos';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING || '');
const database = cosmosClient.database('NomadAIEngineDB');
const container = database.container('quality-management');

// Get audit trends data
router.get('/trends', async (req, res) => {
  try {
    const { resources: audits } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.createdAt DESC"
      })
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
      .query({
        query: "SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.createdAt DESC"
      })
      .fetchAll();

    const insights = await generateAIInsights(audits);
    res.json(insights);
  } catch (error) {
    console.error('Error generating audit insights:', error);
    res.status(500).json({ error: 'Failed to generate audit insights' });
  }
});

// Helper function to process audit trends
function processAuditTrends(audits: any[]): any {
  const monthlyData: Record<string, {
    month: string;
    observations: number;
    minorNonConformities: number;
    majorNonConformities: number;
    opportunities: number;
  }> = {};

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
    audit.findings?.forEach((finding: any) => {
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
async function generateAIInsights(audits: any[]): Promise<any[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Prepare audit data for analysis
  const auditSummary = audits.map(audit => ({
    date: audit.createdAt,
    type: audit.type,
    standard: audit.standard,
    findings: audit.findings,
    status: audit.status
  }));

  try {
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
    return Object.entries(aiResponse).flatMap(([category, items]: [string, any]) =>
      items.map((item: any, index: number) => ({
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
  } catch (error) {
    console.error('Error generating AI insights:', error);
    throw new Error('Failed to generate AI insights');
  }
}

export default router;