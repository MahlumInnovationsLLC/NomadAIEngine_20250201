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

// Add create finding endpoint
router.post('/findings', async (req, res) => {
  try {
    console.log('Creating new finding with data:', req.body);

    const finding = {
      id: `FND-${new Date().getTime()}`,
      type: 'finding', // Document type identifier
      findingType: req.body.type, // The actual finding type (observation, minor, major, etc.)
      description: req.body.description,
      department: req.body.department,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      assignedTo: req.body.assignedTo,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Attempting to create finding in Cosmos DB:', finding);

    // Create the finding document
    const { resource: createdFinding } = await container.items.create(finding);
    console.log('Successfully created finding:', createdFinding);

    // Verify the finding was created by reading it back
    const { resource: verifiedFinding } = await container.item(finding.id, finding.id).read();
    console.log('Verified finding exists:', verifiedFinding);

    res.json(createdFinding);
  } catch (error) {
    console.error('Error creating finding:', error);
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

    // First, let's check what documents exist in the container
    const allDocsQuery = {
      query: "SELECT * FROM c WHERE c.type = 'finding'"
    };

    console.log('Executing query:', allDocsQuery);
    const { resources: findings } = await container.items.query(allDocsQuery).fetchAll();

    console.log(`Found ${findings.length} findings:`, findings);

    // Transform the data to match the client-side Finding type
    const transformedFindings = findings.map(finding => ({
      id: finding.id,
      type: finding.findingType,
      description: finding.description,
      department: finding.department,
      priority: finding.priority,
      dueDate: finding.dueDate,
      assignedTo: finding.assignedTo,
      status: finding.status,
      createdAt: finding.createdAt,
      updatedAt: finding.updatedAt
    }));

    console.log('Transformed findings:', transformedFindings);
    res.json(transformedFindings);
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

    // Get the existing finding
    const { resource: existingFinding } = await container.item(id, id).read();

    if (!existingFinding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const updatedFinding = {
      ...existingFinding,
      ...updates,
      updatedAt: new Date().toISOString()
    };

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

    await container.item(id, id).delete();
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

export default router;