import { Router } from 'express';
import { CosmosClient } from "@azure/cosmos";
import multer from 'multer';
import { uploadNCRAttachment, deleteNCRAttachment } from '../../services/azure/ncr_attachment_service';

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING || '');
const database = cosmosClient.database("NomadAIEngineDB");

// Initialize containers
async function initializeContainer() {
  try {
    const { container } = await database.containers.createIfNotExists({
      id: "quality-management",
      partitionKey: { paths: ["/type"] },
      throughput: 400
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
      .query({
        query: 'SELECT * FROM c WHERE c.type = "ncr" ORDER BY c._ts DESC'
      })
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
      attachments: [],
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

// Upload attachment to NCR
router.post('/ncrs/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { id } = req.params;
    console.log(`Looking for NCR with ID: ${id}`);

    // Query for NCR using id and type
    const { resources: [ncr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'ncr'",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();

    if (!ncr) {
      console.log(`NCR with ID ${id} not found`);
      return res.status(404).json({ message: 'NCR not found' });
    }

    console.log('Found NCR:', ncr);

    // Upload file to blob storage
    console.log('Uploading file to Azure Blob Storage...');
    const attachment = await uploadNCRAttachment(
      req.file,
      id,
      req.body.uploadedBy || 'system'
    );

    // Initialize attachments array if it doesn't exist
    if (!ncr.attachments) {
      ncr.attachments = [];
    }

    // Update NCR with new attachment
    ncr.attachments.push(attachment);
    ncr.updatedAt = new Date().toISOString();

    // Update the NCR document
    console.log('Updating NCR with new attachment...');
    const { resource: updatedNcr } = await container.items.upsert(ncr);

    console.log('NCR updated successfully');
    res.json(updatedNcr);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload attachment';
    console.error('Detailed error:', errorMessage);
    res.status(500).json({ 
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Delete attachment from NCR
router.delete('/ncrs/:ncrId/attachments/:attachmentId', async (req, res) => {
  try {
    if (!container) {
      return res.status(500).json({ message: 'Service unavailable' });
    }

    const { ncrId, attachmentId } = req.params;

    try {
      const { resource: ncr } = await container.item(ncrId, 'ncr').read();

      // Delete file from blob storage
      await deleteNCRAttachment(ncrId, attachmentId);

      // Update NCR attachments
      ncr.attachments = (ncr.attachments || []).filter((a: any) => a.id !== attachmentId);
      ncr.updatedAt = new Date().toISOString();

      // Save updated NCR
      const { resource: updatedNcr } = await container.item(ncrId, 'ncr').replace(ncr);
      res.json(updatedNcr);
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ message: 'NCR not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to delete attachment' 
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
    console.log(`Updating NCR with ID: ${id}`);

    // Query for NCR using id and type
    const { resources: [existingNcr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'ncr'",
        parameters: [{ name: "@id", value: id }]
      })
      .fetchAll();

    if (!existingNcr) {
      console.log(`NCR with ID ${id} not found`);
      return res.status(404).json({ message: 'NCR not found' });
    }

    console.log('Found existing NCR:', existingNcr);

    const ncrData = {
      ...existingNcr,
      ...req.body,
      type: 'ncr', // Preserve the type
      id, // Preserve the ID
      updatedAt: new Date().toISOString()
    };

    // Use upsert instead of replace to handle any partition key issues
    const { resource: updatedNcr } = await container.items.upsert(ncrData);
    console.log('NCR updated successfully');
    res.json(updatedNcr);
  } catch (error) {
    console.error('Error updating NCR:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to update NCR' 
    });
  }
});

export default router;