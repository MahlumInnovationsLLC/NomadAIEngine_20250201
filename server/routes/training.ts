import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@db';
import { uploadTrainingData, getTrainingData } from '../services/azure/blob-service';

const router = express.Router();

// Get training analytics data
router.get('/analytics', async (req: any, res) => {
  try {
    const userId = req.user?.id || 'demo-user'; // Use demo-user for unauthenticated users

    console.log("Fetching training analytics for user:", userId);

    // Get user's training data from blob storage
    const analyticsData = await getTrainingData(userId, 'analytics');

    console.log("Retrieved analytics data:", analyticsData);

    if (!analyticsData) {
      console.log("No analytics data found, returning demo data");
      // Return demo data if no data exists
      const demoData = {
        completionRates: {
          completed: 45,
          inProgress: 30,
          notStarted: 25,
        },
        weeklyProgress: [
          { week: 'Week 1', completions: 5, avgScore: 85 },
          { week: 'Week 2', completions: 8, avgScore: 88 },
          { week: 'Week 3', completions: 12, avgScore: 92 },
          { week: 'Week 4', completions: 15, avgScore: 90 },
        ],
        performanceMetrics: {
          averageScore: 85,
          totalTime: 2400,
          completionRate: 75,
          streak: 7,
          totalPoints: 1250
        },
        skillBreakdown: [
          { skill: 'Safety', level: 85, progress: 85 },
          { skill: 'Technical', level: 75, progress: 75 },
          { skill: 'Compliance', level: 90, progress: 90 },
          { skill: 'Leadership', level: 65, progress: 65 },
          { skill: 'Communication', level: 80, progress: 80 },
        ],
        achievements: [
          {
            name: 'Fast Learner',
            earned: true,
            progress: 100,
            description: 'Complete 5 modules in a week',
            icon: 'trophy'
          },
          {
            name: 'Safety Expert',
            earned: false,
            progress: 75,
            description: 'Complete all safety modules',
            icon: 'shield-check'
          },
          {
            name: 'Team Leader',
            earned: false,
            progress: 40,
            description: 'Complete leadership training track',
            icon: 'users'
          }
        ],
        learningPath: {
          currentLevel: 4,
          xpToNextLevel: 1000,
          totalXP: 750,
          recentMilestones: [
            {
              title: 'Completed Safety Fundamentals',
              date: '2025-02-01'
            },
            {
              title: 'Earned Technical Specialist Badge',
              date: '2025-02-03'
            },
            {
              title: 'Started Leadership Training',
              date: '2025-02-05'
            }
          ]
        }
      };
      return res.json(demoData);
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