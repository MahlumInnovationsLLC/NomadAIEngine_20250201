import { Router } from "express";
import { db } from "@db";
import { members, memberHealthData, memberPreferences, memberAiInsights } from "@db/schema";
import { eq } from "drizzle-orm";
import { azureStorage } from "../services/azure-storage";

const router = Router();

// Get all members with basic information
router.get("/", async (req, res) => {
  try {
    const allMembers = await db.query.members.findMany({
      with: {
        aiInsights: true,
      },
    });

    const membersWithCounts = await Promise.all(allMembers.map(async member => {
      // Get additional data from Azure Storage
      const dataBlobList = await azureStorage.listMemberData(member.id.toString());
      const latestDataBlob = dataBlobList[dataBlobList.length - 1];
      const additionalData = latestDataBlob ? await azureStorage.getMemberData(latestDataBlob) : {};

      return {
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
        ...additionalData
      };
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

    // Get additional data from Azure Storage
    const dataBlobList = await azureStorage.listMemberData(memberId.toString());
    const latestDataBlob = dataBlobList[dataBlobList.length - 1];
    const additionalData = latestDataBlob ? await azureStorage.getMemberData(latestDataBlob) : {};

    res.json({
      ...member,
      ...additionalData
    });
  } catch (error) {
    console.error("Error fetching member details:", error);
    res.status(500).json({ error: "Failed to fetch member details" });
  }
});

// Update member data with Azure Storage integration
router.post("/:id/data", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const memberData = req.body;

    // Store the data in Azure Blob Storage
    const blobName = await azureStorage.uploadMemberData(memberId.toString(), memberData);

    res.json({ 
      message: "Member data updated successfully",
      blobName 
    });
  } catch (error) {
    console.error("Error updating member data:", error);
    res.status(500).json({ error: "Failed to update member data" });
  }
});

// Get member health metrics with Azure integration
router.get("/:id/health", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    // Get basic health data from PostgreSQL
    const healthData = await db.query.memberHealthData.findMany({
      where: eq(memberHealthData.memberId, memberId),
      orderBy: (metrics, { desc }) => [desc(metrics.recordedAt)],
    });

    // Get detailed health data from Azure Storage
    const dataBlobList = await azureStorage.listMemberData(memberId.toString());
    const healthBlobs = dataBlobList.filter(blob => blob.includes('/health/'));
    const detailedHealthData = await Promise.all(
      healthBlobs.map(blob => azureStorage.getMemberData(blob))
    );

    res.json({
      basicMetrics: healthData,
      detailedMetrics: detailedHealthData
    });
  } catch (error) {
    console.error("Error fetching member health data:", error);
    res.status(500).json({ error: "Failed to fetch health data" });
  }
});

export default router;