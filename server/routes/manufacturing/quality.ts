import { Router } from 'express';
import { CosmosClient } from "@azure/cosmos";
import multer from 'multer';
import { uploadNCRAttachment, uploadInspectionAttachment, deleteNCRAttachment, deleteInspectionAttachment } from '../../services/azure/ncr_attachment_service';

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
        query: 'SELECT * FROM c WHERE c.number != null AND STARTSWITH(c.id, "NCR-") ORDER BY c._ts DESC',
        partitionKey: 'default'
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

// Update NCR
router.put('/ncrs/:id', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    console.log(`Updating NCR with ID: ${id}`);

    // Query for NCR using id
    const { resources: [existingNcr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
        partitionKey: 'default'
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
      id,
      userKey: 'default',
      updatedAt: new Date().toISOString(),
      attachments: existingNcr.attachments || []
    };

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

// Create new NCR
router.post('/ncrs', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    console.log('Creating new NCR:', req.body);
    const ncrData = {
      ...req.body,
      id: `NCR-${Date.now()}`,
      userKey: 'default',
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

    // Query for NCR using id
    const { resources: [ncr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
        partitionKey: 'default'
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

// Update the types for attachments
interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobUrl: string;
}

// Delete attachment from NCR
router.delete('/ncrs/:ncrId/attachments/:attachmentId', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { ncrId, attachmentId } = req.params;
    console.log(`Processing deletion request for attachment ${attachmentId} from NCR ${ncrId}`);

    // Query for NCR using id
    const { resources: [ncr] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: ncrId }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!ncr) {
      console.log(`NCR with ID ${ncrId} not found`);
      return res.status(404).json({ message: 'NCR not found' });
    }

    // Verify attachment exists in NCR document
    const attachmentExists = ncr.attachments?.some((a: Attachment) => a.id === attachmentId);
    if (!attachmentExists) {
      console.log(`Attachment ${attachmentId} not found in NCR document`);
      return res.status(404).json({ message: 'Attachment not found in NCR' });
    }

    console.log('Found NCR and attachment in document, proceeding with deletion');

    // Delete from blob storage - now returns a boolean indicating success
    const blobDeleted = await deleteNCRAttachment(ncrId, attachmentId);
    if (blobDeleted) {
      console.log('Successfully deleted blob from storage');
    } else {
      console.log('Blob not found in storage, proceeding with document update');
    }

    // Update NCR attachments
    ncr.attachments = (ncr.attachments || []).filter((a: Attachment) => a.id !== attachmentId);
    ncr.updatedAt = new Date().toISOString();

    // Save updated NCR
    const { resource: updatedNcr } = await container.items.upsert(ncr);
    console.log('Successfully updated NCR document');

    res.json(updatedNcr);
  } catch (error: unknown) {
    console.error('Error in attachment deletion process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Error in attachment deletion process',
      details: errorMessage
    });
  }
});

// Upload attachment to Inspection
router.post('/inspections/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { id } = req.params;
    console.log(`Looking for Inspection with ID: ${id}`);

    const { resources: [inspection] } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
        partitionKey: 'default'
      })
      .fetchAll();

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    console.log('Found Inspection:', inspection);

    // Upload file to blob storage
    console.log('Uploading file to Azure Blob Storage...');
    const attachment = await uploadInspectionAttachment(
      req.file,
      id,
      req.body.uploadedBy || 'system'
    );

    // Initialize attachments array if it doesn't exist
    if (!inspection.attachments) {
      inspection.attachments = [];
    }

    // Update Inspection with new attachment
    inspection.attachments.push(attachment);
    inspection.updatedAt = new Date().toISOString();

    // Update the Inspection document
    console.log('Updating Inspection with new attachment...');
    const { resource: updatedInspection } = await container.items.upsert(inspection);

    console.log('Inspection updated successfully');
    res.json(updatedInspection);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to upload attachment' 
    });
  }
});

// Delete attachment from Inspection
router.delete('/inspections/:inspectionId/attachments/:attachmentId', async (req, res) => {
  try {
    if (!container) {
      return res.status(500).json({ message: 'Service unavailable' });
    }

    const { inspectionId, attachmentId } = req.params;

    try {
      const { resource: inspection } = await container.item(inspectionId, 'default').read();

      // Delete file from blob storage
      await deleteInspectionAttachment(inspectionId, attachmentId);

      // Update Inspection attachments
      inspection.attachments = (inspection.attachments || []).filter((a: any) => a.id !== attachmentId);
      inspection.updatedAt = new Date().toISOString();

      // Save updated Inspection
      const { resource: updatedInspection } = await container.items.upsert(inspection);
      res.json(updatedInspection);
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({ message: 'Inspection not found' });
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

// Update linked NCRs when inspection project number changes
router.put('/inspections/:id/update-ncrs', async (req, res) => {
  try {
    if (!container) {
      container = await initializeContainer();
    }

    const { id } = req.params;
    const { projectNumber } = req.body;

    console.log(`Updating NCRs linked to inspection ${id} with project number ${projectNumber}`);

    // First, find all NCRs linked to this inspection
    const { resources: linkedNcrs } = await container.items
      .query({
          query: "SELECT * FROM c WHERE c.inspectionId = @inspectionId",
          parameters: [{ name: "@inspectionId", value: id }],
          partitionKey: 'default'
      })
      .fetchAll();

    console.log(`Found ${linkedNcrs.length} linked NCRs to update`);

    // Update each linked NCR with the new project number
    const updatePromises = linkedNcrs.map(async (ncr) => {
      const updatedNcr = {
        ...ncr,
        projectNumber,
        updatedAt: new Date().toISOString()
      };

      return container.items.upsert(updatedNcr);
    });

    await Promise.all(updatePromises);

    console.log('Successfully updated all linked NCRs');
    res.json({ message: 'Successfully updated linked NCRs', updatedCount: linkedNcrs.length });
  } catch (error) {
    console.error('Error updating linked NCRs:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to update linked NCRs' 
    });
  }
});


export default router;