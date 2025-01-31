import { Router } from 'express';
import { CosmosClient } from "@azure/cosmos";

const router = Router();

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || '');
const database = cosmosClient.database("NomadAIEngineDB");

// Initialize containers
async function initializeContainer() {
  try {
    const { container } = await database.containers.createIfNotExists({
      id: "quality-management",
      partitionKey: { paths: ["/userKey"] },
      throughput: {
        autoScale: {
          maxThroughput: 1000 // Set autoscale max RU/s to 1000
        }
      }
    });
    console.log("Successfully initialized quality-management container");
    return container;
  } catch (error) {
    console.error("Error initializing container:", error);
    throw error;
  }
}

let container: any;
initializeContainer().then(c => {
  container = c;
}).catch(console.error);

// Get all NCRs
router.get('/ncrs', async (req, res) => {
  try {
    if (!container) {
      console.log('Container not initialized, attempting to initialize...');
      container = await initializeContainer();
    }

    console.log('Fetching NCRs from Cosmos DB...');
    const { resources: ncrs } = await container.items
      .query('SELECT * FROM c WHERE c.type = "ncr" ORDER BY c._ts DESC')
      .fetchAll();

    console.log(`Found ${ncrs.length} NCRs`);
    res.json(ncrs);
  } catch (error) {
    console.error('Error fetching NCRs:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch NCRs' 
    });
  }
});

// Create new NCR
router.post('/ncrs', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    console.log('Creating new NCR:', req.body);
    const ncrData = {
      ...req.body,
      type: 'ncr',
      id: `NCR-${Date.now()}`,
      userKey: req.body.userKey || 'default', // Add userKey for partitioning
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource: createdNcr } = await container.items.create(ncrData);
    console.log('Created NCR:', createdNcr);
    res.status(201).json(createdNcr);
  } catch (error) {
    console.error('Error creating NCR:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to create NCR' 
    });
  }
});

// Update NCR
router.put('/ncrs/:id', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    const userKey = req.body.userKey || 'default'; // Get userKey for partition
    const ncrData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const { resource: updatedNcr } = await container.item(id, userKey).replace(ncrData);
    res.json(updatedNcr);
  } catch (error) {
    console.error('Error updating NCR:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to update NCR' 
    });
  }
});

export default router;