import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@db';
import { uploadTrainingData, getTrainingData } from '../services/azure/blob-service';

const router = express.Router();

// Get training analytics data
router.get('/analytics', async (req: any, res) => {
  try {
    const userId = req.user?.id || 'demo-user'; // Use demo-user for unauthenticated users

    // Get user's training data from blob storage
    const analyticsData = await getTrainingData(userId, 'analytics');

    if (!analyticsData) {
      return res.status(404).json({ error: "No training data found" });
    }

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching training analytics:", error);
    res.status(500).json({ error: "Failed to fetch training analytics" });
  }
});

// Update training progress
router.post('/progress', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { moduleId, progress, status } = req.body;

    // Store progress data in blob storage
    await uploadTrainingData(userId, moduleId, { progress, status, updatedAt: new Date() });

    res.json({ message: "Training progress updated successfully" });
  } catch (error) {
    console.error("Error updating training progress:", error);
    res.status(500).json({ error: "Failed to update training progress" });
  }
});

export default router;