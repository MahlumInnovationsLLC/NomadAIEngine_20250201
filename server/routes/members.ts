import { Router } from "express";
import { db } from "@db";
import { members, memberHealthData, memberPreferences, memberAiInsights } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all members with basic information
router.get("/", async (req, res) => {
  try {
    const allMembers = await db.query.members.findMany({
      with: {
        aiInsights: true,
      },
    });

    const membersWithCounts = allMembers.map(member => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      membershipType: member.membershipType,
      membershipStatus: member.membershipStatus,
      joinDate: member.joinDate,
      lastVisit: member.lastVisit,
      totalVisits: member.totalVisits,
      aiInsightCount: member.aiInsights.length,
    }));

    res.json(membersWithCounts);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// Get detailed member data by ID
router.get("/:id", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      with: {
        healthData: true,
        preferences: true,
        aiInsights: {
          where: eq(memberAiInsights.status, 'active'),
          orderBy: (insights, { desc }) => [desc(insights.generatedAt)],
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(member);
  } catch (error) {
    console.error("Error fetching member details:", error);
    res.status(500).json({ error: "Failed to fetch member details" });
  }
});

// Get member health metrics
router.get("/:id/health", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const healthData = await db.query.memberHealthData.findMany({
      where: eq(memberHealthData.memberId, memberId),
      orderBy: (metrics, { desc }) => [desc(metrics.recordedAt)],
    });

    res.json(healthData);
  } catch (error) {
    console.error("Error fetching member health data:", error);
    res.status(500).json({ error: "Failed to fetch health data" });
  }
});

// Get member AI insights
router.get("/:id/insights", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const insights = await db.query.memberAiInsights.findMany({
      where: eq(memberAiInsights.memberId, memberId),
      orderBy: (insights, { desc }) => [desc(insights.generatedAt)],
    });

    res.json(insights);
  } catch (error) {
    console.error("Error fetching member insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

export default router;
