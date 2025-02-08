import { Router } from 'express';
import { OpenAI } from 'openai';
import { CosmosClient } from '@azure/cosmos';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || '');
const database = cosmosClient.database('NomadAIEngineDB');
const container = database.container('quality-management');

// Get next finding number
async function getNextFindingNumber(): Promise<number> {
  try {
    console.log('Getting next finding number...');
    const counterId = 'findings-counter';

    // Try to get the counter document
    const { resources: counters } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: counterId }]
      })
      .fetchAll();

    if (counters.length === 0) {
      console.log('Counter not found, creating new counter...');
      // Create counter if it doesn't exist
      const newCounter = {
        id: counterId,
        type: 'counter',
        name: 'findings',
        value: 1
      };

      const { resource: createdCounter } = await container.items.create(newCounter);
      console.log('Created new counter:', createdCounter);
      return 1;
    }

    const counter = counters[0];
    console.log('Found existing counter:', counter);

    // Increment counter
    counter.value += 1;
    const { resource: updatedCounter } = await container.item(counterId, counterId).replace(counter);
    console.log('Updated counter:', updatedCounter);

    return updatedCounter.value;
  } catch (error) {
    console.error('Error getting next finding number:', error);
    throw error;
  }
}

// Department abbreviations map
const departmentAbbreviations: Record<string, string> = {
  'Quality': 'QA',
  'Production': 'PR',
  'Engineering': 'EN',
  'Maintenance': 'MT',
  'Safety': 'SF',
  'Operations': 'OP',
  // Add more departments as needed
};

// Add create finding endpoint
router.post('/findings', async (req, res) => {
  try {
    console.log('Creating new finding with data:', req.body);

    const findingNumber = await getNextFindingNumber();
    console.log('Got finding number:', findingNumber);

    const deptAbbr = departmentAbbreviations[req.body.department] || 'OT'; // OT for Other
    const findingId = `FND-${String(findingNumber).padStart(3, '0')}-${deptAbbr}`;

    console.log('Generated finding ID:', findingId);

    const finding = {
      id: findingId,
      type: 'finding',
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'open'
    };

    console.log('Creating finding in database:', finding);

    if (req.body.auditId) {
      // If auditId is provided, add finding to the audit's findings array
      const { resource: audit } = await container.item(req.body.auditId, req.body.auditId).read();

      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      if (!audit.findings) {
        audit.findings = [];
      }

      audit.findings.push(finding);
      audit.updatedAt = new Date().toISOString();

      await container.item(req.body.auditId, req.body.auditId).replace(audit);
      console.log('Added finding to audit:', audit.id);
      res.json(finding);
    } else {
      // If no auditId, create as standalone finding
      const { resource } = await container.items.create(finding);
      console.log('Created standalone finding:', resource);
      res.json(resource);
    }
  } catch (error) {
    console.error('Detailed error creating finding:', error);
    res.status(500).json({
      error: 'Failed to create finding',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all findings
router.get('/findings', async (req, res) => {
  try {
    console.log('Fetching findings...');

    // Query for standalone findings
    const findingsQuery = {
      query: "SELECT * FROM c WHERE c.type = 'finding'",
    };

    console.log('Executing standalone findings query...');
    const { resources: standaloneFindings } = await container.items
      .query(findingsQuery)
      .fetchAll();

    console.log('Standalone findings:', JSON.stringify(standaloneFindings, null, 2));

    // Query for audits with findings
    const auditQuery = {
      query: "SELECT * FROM c WHERE c.type = 'audit' AND IS_DEFINED(c.findings)",
    };

    console.log('Executing audit findings query...');
    const { resources: auditsWithFindings } = await container.items
      .query(auditQuery)
      .fetchAll();

    console.log('Audits with findings:', JSON.stringify(auditsWithFindings, null, 2));

    // Extract findings from audits and add auditId
    const auditFindings = auditsWithFindings.flatMap(audit => {
      if (!audit.findings) return [];
      return audit.findings.map((finding: any) => ({
        ...finding,
        auditId: audit.id,
      }));
    });

    // Combine standalone and audit findings
    const allFindings = [...standaloneFindings, ...auditFindings];
    console.log('All findings:', JSON.stringify(allFindings, null, 2));

    res.json(allFindings);
  } catch (error) {
    console.error('Error fetching findings:', error);
    res.status(500).json({
      error: 'Failed to fetch findings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update finding
router.put('/findings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('Updating finding:', id, updates);

    const { resources: [finding] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'finding' AND c.id = @id",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();

    if (!finding) {
      console.log('Finding not found:', id);
      return res.status(404).json({ error: 'Finding not found' });
    }

    const updatedFinding = {
      ...finding,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    console.log('Updating finding with data:', updatedFinding);

    const { resource } = await container.item(id, id).replace(updatedFinding);
    console.log('Successfully updated finding:', resource);

    res.json(resource);
  } catch (error) {
    console.error('Error updating finding:', error);
    res.status(500).json({
      error: 'Failed to update finding',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete finding
router.delete('/findings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting finding:', id);

    const { resource } = await container.item(id, id).delete();
    console.log('Successfully deleted finding:', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting finding:', error);
    res.status(500).json({
      error: 'Failed to delete finding',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


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
    res.status(500).json({
      error: 'Failed to fetch audit trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get AI-generated insights
router.get('/insights', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    const { resources: audits } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.createdAt DESC"
      })
      .fetchAll();

    if (!audits || audits.length === 0) {
      return res.json([]);
    }

    const insights = await generateAIInsights(audits);
    res.json(insights);
  } catch (error) {
    console.error('Error generating audit insights:', error);
    res.status(500).json({
      error: 'Failed to generate audit insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
      model: "gpt-4", // Using standard GPT-4 model
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
    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');

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
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI insights');
  }
}

export default router;