import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { facilityStorage } from '../services/azure/facility_storage_service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Handle 3D model uploads
router.post('/upload-model', fileUpload(), async (req, res) => {
  try {
    if (!req.files || !req.files.model) {
      return res.status(400).json({ error: 'No model file uploaded' });
    }

    const modelFile = req.files.model;
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    
    // Generate a unique ID for the model
    const modelId = uuidv4();
    
    // Upload to Azure Blob Storage
    const url = await facilityStorage.uploadModel(
      modelFile.data,
      {
        modelId,
        name: metadata.name || modelFile.name,
        type: metadata.type || '3d-model',
        uploadedAt: metadata.uploadedAt || new Date().toISOString(),
        size: modelFile.size,
        format: metadata.format || modelFile.name.split('.').pop()?.toLowerCase() || 'unknown'
      }
    );

    res.json({ url, modelId });
  } catch (error) {
    console.error('Error uploading model:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to upload model' 
    });
  }
});

// Save building data
router.post('/save-building', async (req, res) => {
  try {
    const buildingData = req.body;
    const savedData = await facilityStorage.saveBuildingData(buildingData);
    res.json(savedData);
  } catch (error) {
    console.error('Error saving building data:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to save building data' 
    });
  }
});

// Get building data
router.get('/building/:id', async (req, res) => {
  try {
    const buildingId = req.params.id;
    const buildingData = await facilityStorage.getBuildingData(buildingId);
    
    if (!buildingData) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    res.json(buildingData);
  } catch (error) {
    console.error('Error retrieving building data:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve building data' 
    });
  }
});

// List available 3D models
router.get('/models', async (req, res) => {
  try {
    const models = await facilityStorage.listModels();
    res.json(models);
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to list models' 
    });
  }
});

export default router;
