import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/analytics', async (req, res) => {
  try {
    // Mock data for now - will be replaced with actual database queries
    const analyticsData = {
      completionRates: {
        completed: 45,
        inProgress: 30,
        notStarted: 25,
      },
      weeklyProgress: [
        { week: 'Week 1', completions: 5 },
        { week: 'Week 2', completions: 8 },
        { week: 'Week 3', completions: 12 },
        { week: 'Week 4', completions: 15 },
      ],
      performanceMetrics: {
        averageScore: 85,
        totalTime: 2400, // in minutes
        completionRate: 75,
      },
      categoryBreakdown: [
        { name: 'Safety', value: 30 },
        { name: 'Technical', value: 25 },
        { name: 'Compliance', value: 20 },
        { name: 'Soft Skills', value: 25 },
      ],
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching training analytics:', error);
    res.status(500).json({ error: 'Failed to fetch training analytics' });
  }
});

export default router;
