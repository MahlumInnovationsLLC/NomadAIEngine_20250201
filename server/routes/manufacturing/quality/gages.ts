import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Container } from '@azure/cosmos';
import multer from 'multer';
import { AuthenticatedRequest, authMiddleware } from '../../../auth-middleware';
import { getContainer } from '../../../services/azure/cosmos_service';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
let gagesContainer: Container | null = null;

async function initializeGagesContainer(): Promise<Container> {
  if (!gagesContainer) {
    console.log('Initializing gages container');
    
    try {
      // Get the container from the service
      const container = getContainer('quality-management');
      
      if (!container) {
        throw new Error('Failed to get quality-management container');
      }
      
      gagesContainer = container;
      console.log('Successfully initialized gages container');
    } catch (error) {
      console.error('Error initializing gages container:', error);
      throw new Error('Failed to initialize gages container');
    }
  }
  return gagesContainer;
}

// Get all gages
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'gage' ORDER BY c.updatedAt DESC"
      })
      .fetchAll();
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching gages:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch gages',
      details: error instanceof Error ? error.stack : undefined 
    });
  }
});

// Get a specific gage by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    
    const { resource } = await container.item(id, id).read();
    
    if (!resource) {
      return res.status(404).json({ message: 'Gage not found' });
    }
    
    res.json(resource);
  } catch (error) {
    console.error('Error fetching gage:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch gage',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Create a new gage
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const gageData = req.body;
    
    // Calculate if calibration is due
    const nextCalDate = new Date(gageData.nextCalibrationDate);
    const today = new Date();
    gageData.isCalibrationDue = nextCalDate <= today;
    
    // Set audit fields
    gageData.type = 'gage';
    gageData.createdBy = req.user?.id || 'system';
    gageData.createdAt = new Date().toISOString();
    gageData.updatedAt = new Date().toISOString();
    
    const { resource: createdGage } = await container.items.create(gageData);
    
    res.status(201).json(createdGage);
  } catch (error) {
    console.error('Error creating gage:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create gage',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Update a gage
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    const gageData = req.body;
    
    // Calculate if calibration is due
    const nextCalDate = new Date(gageData.nextCalibrationDate);
    const today = new Date();
    gageData.isCalibrationDue = nextCalDate <= today;
    
    // Set audit fields
    gageData.updatedAt = new Date().toISOString();
    gageData.updatedBy = req.user?.id || 'system';
    
    const { resource: updatedGage } = await container.item(id, id).replace(gageData);
    
    res.json(updatedGage);
  } catch (error) {
    console.error('Error updating gage:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update gage',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Delete a gage
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    
    await container.item(id, id).delete();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gage:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete gage',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Add a calibration record to a gage
router.post('/:id/calibration', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    const calibrationData = req.body;
    
    // Get the gage
    const { resource: gage } = await container.item(id, id).read();
    
    if (!gage) {
      return res.status(404).json({ message: 'Gage not found' });
    }
    
    // Add the new calibration record
    const calibrationRecords = gage.calibrationRecords || [];
    calibrationRecords.push(calibrationData);
    
    // Update gage with new calibration info
    const updates = {
      ...gage,
      calibrationRecords,
      lastCalibrationDate: calibrationData.date,
      nextCalibrationDate: calibrationData.nextCalibrationDate,
      isCalibrationDue: new Date(calibrationData.nextCalibrationDate) <= new Date(),
      status: gage.status === 'in_calibration' ? 'active' : gage.status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || 'system'
    };
    
    const { resource: updatedGage } = await container.item(id, id).replace(updates);
    
    res.json(updatedGage);
  } catch (error) {
    console.error('Error adding calibration record:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to add calibration record',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Add a maintenance record to a gage
router.post('/:id/maintenance', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    const maintenanceData = req.body;
    
    // Ensure ID is set
    maintenanceData.id = maintenanceData.id || uuidv4();
    
    // Get the gage
    const { resource: gage } = await container.item(id, id).read();
    
    if (!gage) {
      return res.status(404).json({ message: 'Gage not found' });
    }
    
    // Add the new maintenance record
    const maintenanceRecords = gage.maintenanceRecords || [];
    maintenanceRecords.push(maintenanceData);
    
    // Update gage with new maintenance info
    const updates = {
      ...gage,
      maintenanceRecords,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || 'system'
    };
    
    const { resource: updatedGage } = await container.item(id, id).replace(updates);
    
    res.json(updatedGage);
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to add maintenance record',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Check out a gage
router.post('/:id/checkout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    const { userId } = req.body;
    
    // Get the gage
    const { resource: gage } = await container.item(id, id).read();
    
    if (!gage) {
      return res.status(404).json({ message: 'Gage not found' });
    }
    
    if (gage.status !== 'active') {
      return res.status(400).json({ message: `Gage cannot be checked out because it is ${gage.status}` });
    }
    
    if (gage.checkedOutTo) {
      return res.status(400).json({ message: `Gage is already checked out to ${gage.checkedOutTo}` });
    }
    
    const checkoutDate = new Date().toISOString();
    
    // Update checkout info
    const updates = {
      ...gage,
      checkedOutTo: userId || req.user?.id || 'anonymous',
      checkedOutDate: checkoutDate,
      checkoutHistory: [
        ...(gage.checkoutHistory || []),
        {
          user: userId || req.user?.id || 'anonymous',
          checkoutDate,
          returnDate: null
        }
      ],
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || 'system'
    };
    
    const { resource: updatedGage } = await container.item(id, id).replace(updates);
    
    res.json(updatedGage);
  } catch (error) {
    console.error('Error checking out gage:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to check out gage',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Check in a gage
router.post('/:id/checkin', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    const { id } = req.params;
    const { condition, notes } = req.body;
    
    // Get the gage
    const { resource: gage } = await container.item(id, id).read();
    
    if (!gage) {
      return res.status(404).json({ message: 'Gage not found' });
    }
    
    if (!gage.checkedOutTo) {
      return res.status(400).json({ message: 'Gage is not checked out' });
    }
    
    const returnDate = new Date().toISOString();
    
    // Update the last checkout record with return info
    const checkoutHistory = [...(gage.checkoutHistory || [])];
    const lastCheckoutIndex = checkoutHistory.length - 1;
    
    if (lastCheckoutIndex >= 0) {
      checkoutHistory[lastCheckoutIndex] = {
        ...checkoutHistory[lastCheckoutIndex],
        returnDate,
        condition: condition || 'good',
        notes: notes || ''
      };
    }
    
    // Update gage with checkin info
    const updates = {
      ...gage,
      checkedOutTo: null,
      checkedOutDate: null,
      checkoutHistory,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || 'system'
    };
    
    const { resource: updatedGage } = await container.item(id, id).replace(updates);
    
    res.json(updatedGage);
  } catch (error) {
    console.error('Error checking in gage:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to check in gage',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Upload attachments for a gage
router.post('/attachments', authMiddleware, upload.array('files'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This is a placeholder since we won't implement the actual file upload functionality yet
    // In a real implementation, this would upload to blob storage and return URLs
    
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Create mock attachment objects
    const attachments = (req.files as Express.Multer.File[]).map(file => ({
      id: uuidv4(),
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      blobUrl: `https://example.com/uploads/${file.originalname}`, // Mock URL
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id || 'system'
    }));
    
    res.status(201).json(attachments);
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to upload attachments',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get due for calibration gages
router.get('/due/calibration', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const container = await initializeGagesContainer();
    
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'gage' AND c.isCalibrationDue = true ORDER BY c.nextCalibrationDate ASC"
      })
      .fetchAll();
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching due calibration gages:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch due calibration gages',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

export { router as gagesRouter };