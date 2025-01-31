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
      attachments: [], // Initialize empty attachments array
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

// Upload attachment to NCR
router.post('/ncrs/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    console.log('Starting NCR attachment upload...');
    if (!container) {
      console.log('Container not initialized, initializing...');
      container = await initializeContainer();
    }

    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ message: 'No file provided' });
    }

    const { id } = req.params;
    const userKey = req.body.userKey || 'default';

    console.log(`Reading NCR ${id} with userKey ${userKey}`);
    // Get the existing NCR
    const { resource: ncr } = await container.item(id, userKey).read();
    if (!ncr) {
      console.log('NCR not found');
      return res.status(404).json({ message: 'NCR not found' });
    }

    console.log('Uploading file to Azure Blob Storage...');
    // Upload file to blob storage
    const attachment = await uploadNCRAttachment(
      req.file,
      id,
      req.body.uploadedBy || 'system'
    );

    console.log('File uploaded successfully, updating NCR in Cosmos DB...');
    // Update NCR with new attachment
    ncr.attachments = [...(ncr.attachments || []), {
      ...attachment,
      ncrId: id
    }];
    ncr.updatedAt = new Date().toISOString();

    console.log('Saving updated NCR...');
    // Save updated NCR
    const { resource: updatedNcr } = await container.item(id, userKey).replace(ncr);
    console.log('NCR updated successfully');
    res.json(updatedNcr);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to upload attachment' 
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
    const userKey = req.body.userKey || 'default';

    // Get the existing NCR
    const { resource: ncr } = await container.item(ncrId, userKey).read();
    if (!ncr) {
      return res.status(404).json({ message: 'NCR not found' });
    }

    // Delete file from blob storage
    await deleteNCRAttachment(ncrId, attachmentId);

    // Update NCR attachments
    ncr.attachments = (ncr.attachments || []).filter((a: any) => a.id !== attachmentId);
    ncr.updatedAt = new Date().toISOString();

    // Save updated NCR
    const { resource: updatedNcr } = await container.item(ncrId, userKey).replace(ncr);
    res.json(updatedNcr);
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