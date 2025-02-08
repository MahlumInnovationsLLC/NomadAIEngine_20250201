
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

// Department abbreviations map
const departmentAbbreviations: Record<string, string> = {
  'Quality': 'QA',
  'Production': 'PR',
  'Engineering': 'EN',
  'Maintenance': 'MT',
  'Safety': 'SF',
  'Operations': 'OP',
  'Other': 'OT'
};

// Get next finding number
async function getNextFindingNumber(): Promise<number> {
  try {
    const counterId = 'findings-counter';

    // Try to get the counter document
    const { resources: counters } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: counterId }]
      })
      .fetchAll();

    if (counters.length === 0) {
      // Create counter if it doesn't exist
      const newCounter = {
        id: counterId,
        type: 'counter',
        name: 'findings',
        value: 1
      };

      await container.items.create(newCounter);
      return 1;
    }

    const counter = counters[0];

    // Increment counter
    counter.value += 1;
    await container.item(counterId, counterId).replace(counter);

    return counter.value;
  } catch (error) {
    console.error('Error getting next finding number:', error);
    throw error;
  }
}

// Add create finding endpoint
router.post('/findings', async (req, res) => {
  try {
    console.log('Creating new finding with data:', req.body);

    const findingNumber = await getNextFindingNumber();
    console.log('Got finding number:', findingNumber);

    const deptAbbr = departmentAbbreviations[req.body.department] || 'OT';
    const findingId = `FND-${String(findingNumber).padStart(3, '0')}-${deptAbbr}`;

    console.log('Generated finding ID:', findingId);

    const finding = {
      id: findingId,
      docType: 'finding',
      type: req.body.type,
      description: req.body.description,
      department: req.body.department,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      assignedTo: req.body.assignedTo,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Attempting to create finding:', finding);

    const { resource: createdFinding } = await container.items.create(finding);
    console.log('Successfully created finding:', createdFinding);

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

    const findingsQuery = {
      query: "SELECT * FROM c WHERE c.docType = 'finding' ORDER BY c.createdAt DESC"
    };

    console.log('Executing findings query:', findingsQuery);
    const { resources: findings } = await container.items.query(findingsQuery).fetchAll();

    console.log(`Found ${findings.length} findings:`, findings);

    res.json(findings);
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

// Add update finding ID endpoint
router.put('/findings/:id/update-id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newId } = req.body;

    console.log(`Updating finding ID from ${id} to ${newId}`);

    // Get the existing finding
    const { resource: existingFinding } = await container.item(id, id).read();

    if (!existingFinding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    // Create new finding document with updated ID
    const updatedFinding = {
      ...existingFinding,
      id: newId,
    };

    try {
      // First try to create the new document
      const { resource: newFinding } = await container.items.create(updatedFinding);
      console.log('Successfully created finding with new ID:', newFinding);

      // Only after successful creation, delete the old document
      await container.item(id, id).delete();
      console.log('Successfully deleted old finding:', id);

      res.json(newFinding);
    } catch (createError) {
      console.error('Error during ID update:', createError);

      // If we failed to create the new document, no cleanup needed
      if (createError.code === 409) {
        return res.status(409).json({
          error: 'Failed to update finding ID',
          details: 'A finding with this ID already exists'
        });
      }

      throw createError; // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Error updating finding ID:', error);
    res.status(500).json({
      error: 'Failed to update finding ID',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all findings endpoint
router.delete('/findings/clear-all', async (req, res) => {
  try {
    console.log('Clearing all findings...');
    
    const { resources: findings } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.docType = 'finding'"
      })
      .fetchAll();

    console.log(`Found ${findings.length} findings to delete`);

    for (const finding of findings) {
      try {
        await container.item(finding.id, finding.id).delete();
        console.log(`Successfully deleted finding ${finding.id}`);
      } catch (deleteError) {
        console.error(`Error deleting finding ${finding.id}:`, deleteError);
      }
    }

    // Reset the findings counter
    const counterId = 'findings-counter';
    const counterResponse = await container.item(counterId, counterId).read();
    if (counterResponse.resource) {
      await container.item(counterId, counterId).replace({
        ...counterResponse.resource,
        value: 0
      });
    }

    res.json({ message: 'All findings cleared successfully' });
  } catch (error) {
    console.error('Error clearing findings:', error);
    res.status(500).json({
      error: 'Failed to clear findings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
